import json
import asyncio
import websockets
import pytz
from datetime import datetime, time
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
## For Testing
from alpaca.data.live import StockDataStream


class OptionPriceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.symbol = self.scope['url_route']['kwargs']['symbol']
        if not self.symbol.startswith('T.'):
            self.symbol = f"T.{self.symbol}"
            
        await self.accept()
        market_status = self.get_market_status()
        await self.send(text_data=json.dumps({
            "status": "connecting",
            "symbol": self.symbol,
            "market_status": market_status,
            "server_time": str(datetime.now(pytz.timezone('America/New_York')))
        }))
        
        try:
            # 1. Connect to Alpaca's WebSocket
            self.alpaca_ws = await websockets.connect(
                "wss://stream.data.alpaca.markets/v2/iex",
                extra_headers={
                    "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
                    "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY
                },
                ping_interval=20,
                ping_timeout=30,
                max_queue=1024  # Increased buffer size
            )
            
            # 2. Authenticate
            await self.alpaca_ws.send(json.dumps({
                "action": "auth",
                "key": settings.ALPACA_API_KEY,
                "secret": settings.ALPACA_SECRET_KEY
            }))
            
            # 3. Verify authentication
            auth_response = await self.alpaca_ws.recv()
            if not self._is_success_response(auth_response):
                raise ConnectionError("Authentication failed")
            
            # 4. Subscribe to options data
            await self.alpaca_ws.send(json.dumps({
                "action": "subscribe",
                "trades": [self.symbol],
                "quotes": [self.symbol]
            }))
            
            await self.send(text_data=json.dumps({
                "status": "connected",
                "message": "Streaming active - waiting for data",
                "market_status": self.get_market_status(),
                "server_time": str(datetime.now(pytz.timezone('America/New_York')))
            }))
            
            # 5. Process messages with timeout
            while True:
                try:
                    message = await asyncio.wait_for(
                        self.alpaca_ws.recv(),
                        timeout=30.0  # Timeout if no data for 30s
                    )
                    await self.handle_market_data(message)
                except asyncio.TimeoutError:
                    await self.send(text_data=json.dumps({
                        "status": "keepalive",
                        "message": "Waiting for data...",
                        "server_time": str(datetime.now(pytz.timezone('America/New_York')))
                    }))
                    
        except Exception as e:
            await self.send(text_data=json.dumps({
                "status": "error",
                "message": str(e),
                "server_time": str(datetime.now(pytz.timezone('America/New_York'))),
                "solution": "1) Try a different symbol 2) Check Alpaca status page"
            }))
            if hasattr(self, 'alpaca_ws'):
                await self.alpaca_ws.close()

    async def handle_market_data(self, message):
        """Process and forward market data"""
        try:
            data = json.loads(message)
            if isinstance(data, list):
                data = data[0]  # Take first item if array
            
            if not isinstance(data, dict):
                return
                
            message_type = data.get('T')
            if message_type == 't':  # Trade
                await self.send(text_data=json.dumps({
                    "event": "trade",
                    "symbol": data.get('S'),
                    "price": float(data.get('p', 0)),
                    "size": int(data.get('s', 0)),
                    "timestamp": data.get('t'),
                    "conditions": data.get('c', [])
                }))
            elif message_type == 'q':  # Quote
                await self.send(text_data=json.dumps({
                    "event": "quote",
                    "symbol": data.get('S'),
                    "bid_price": float(data.get('b', 0)),
                    "bid_size": int(data.get('bs', 0)),
                    "ask_price": float(data.get('a', 0)),
                    "ask_size": int(data.get('as', 0)),
                    "timestamp": data.get('t')
                }))
                
        except json.JSONDecodeError:
            pass

    def get_market_status(self):
        """Accurate market hours check in Eastern Time"""
        eastern = pytz.timezone('America/New_York')
        now = datetime.now(eastern)
        market_open = time(9, 30)
        market_close = time(16, 0)
        
        # Check if weekday (Monday=0, Sunday=6)
        if now.weekday() >= 5:  # Saturday or Sunday
            return "closed (weekend)"
            
        current_time = now.time()
        if market_open <= current_time <= market_close:
            return "open"
        return "closed"

    def _is_success_response(self, message):
        try:
            data = json.loads(message)
            if isinstance(data, list):
                data = data[0]
            return data.get('T') == 'success'
        except:
            return False

    async def disconnect(self, close_code):
        if hasattr(self, 'alpaca_ws'):
            await self.alpaca_ws.close()

class InvalidPathConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({
            "error": "Invalid WebSocket endpoint",
            "valid_endpoints": [
                "/ws/options/{symbol}/"
            ]
        }))
        await self.close(code=4001)  # Custom close code

## for testing
# class OptionPriceConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         await self.accept()
#         await self.send(text_data=json.dumps({"status": "Connected successfully!"}))

#     async def receive(self, text_data):
#         # Echo back received messages for testing
#         await self.send(text_data=json.dumps({"echo": text_data}))


# class OptionPriceConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.symbol = self.scope['url_route']['kwargs']['symbol']
#         await self.accept()
        
#         # Initialize Alpaca client
#         self.alpaca_stream = StockDataStream(
#             api_key='YOUR_KEY',
#             secret_key='YOUR_SECRET',
#             raw_data=True  # Get unprocessed WebSocket messages
#         )
        
#         # Subscribe to options data
#         self.alpaca_stream.subscribe_options_trades(f"T.{self.symbol}")
#         self.alpaca_stream.subscribe_options_quotes(f"T.{self.symbol}")
        
#         # Start listening
#         self.alpaca_stream.run()

#     async def disconnect(self, close_code):
#         if hasattr(self, 'alpaca_stream'):
#             self.alpaca_stream.stop()
        
#     async def receive(self, text_data):
#         # Handle messages from frontend (if needed)
#         pass

#     # Alpaca will call this automatically
#     async def on_options_data(self, data):
#         await self.send(text_data=json.dumps(data))