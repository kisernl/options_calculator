# put_calculator/views.py
from django.shortcuts import render
import requests
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from datetime import datetime, timedelta
from alpaca.data.historical.stock import StockHistoricalDataClient
from alpaca.data.requests import StockLatestTradeRequest
from polygon import RESTClient
import finnhub

@api_view(['GET'])
def get_finnhub_quote(request):
    symbol = request.query_params.get('symbol', 'AAPL')  # Get 'symbol' from query params, default to AAPL
    finnhub_api_key = settings.FINNHUB_API_KEY
    finnhub_client = finnhub.Client(api_key=finnhub_api_key)

    quote_data = finnhub_client.quote(symbol)
    return Response({"quote": quote_data})


@api_view(['GET'])
def get_last_quote_polygon(request):
    ticker_symbol = request.query_params.get('underlying_symbols', 'SPY') # Default to SPY

    if not ticker_symbol:
        return Response({"error": "underlying_symbols parameter is required."}, status=400)

    api_key = settings.POLYGON_API_KEY
    if not api_key:
        return Response({"error": "POLYGON_API_KEY is not set in settings."}, status=500)

    client = RESTClient(api_key, connect_timeout=5, read_timeout=10)

    try:
        print(f"Fetching last quote for {ticker_symbol}...")
        last_quote = client.get_last_quote(ticker_symbol)
        print(f"Last quote response: {last_quote}")
        if last_quote and hasattr(last_quote, 'results'):
            return Response({"last_quote": last_quote.results})
        else:
            return Response({"error": f"Could not retrieve last quote for {ticker_symbol}."}, status=404)

    except Exception as e:
        error_message = f"Error fetching last quote: {str(e)}"
        print(f"Exception caught: {error_message}")
        return Response({"error": error_message}, status=500)

#### Tests

@api_view(['GET'])
def test_polygon_options(request):
    ticker_symbol = request.query_params.get('underlying_symbols', 'SPY')
    api_key = settings.POLYGON_API_KEY
    client = RESTClient(api_key, connect_timeout=5, read_timeout=10)
    try:
        contracts = client.list_options_contracts(ticker_symbol, limit=1)
        return Response({"message": f"Successfully called list_options_contracts for {ticker_symbol}"})
    except Exception as e:
        return Response({"error": f"Error calling list_options_contracts: {e}"}, status=500)

@api_view(['GET'])
def simple_test(request):
    return Response({"message": "Simple test successful"})

#####

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from datetime import datetime, timedelta
from polygon import RESTClient
import requests

@api_view(['GET'])
def get_option_contracts_polygon(request):
    ticker_symbol = request.query_params.get('underlying_symbols', 'SPY')

    if not ticker_symbol:
        return Response({"error": "underlying_symbols parameter is required."}, status=400)

    api_key = settings.POLYGON_API_KEY
    print(f"API Key: {api_key}") # Check API Key

    if not api_key:
        return Response({"error": "POLYGON_API_KEY is not set in settings."}, status=500)

    client = RESTClient(api_key, connect_timeout=5, read_timeout=10)
    print(f"Client object: {client}") # Check Client Object

    try:
        # Get the current stock price
        print("Fetching current stock price...")
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        aggs = client.get_aggs(ticker_symbol, 1, "day", yesterday.strftime('%Y-%m-%d'), today.strftime('%Y-%m-%d'))
        print(f"Stock price aggregation response: {aggs}")
        if aggs and isinstance(aggs, list) and aggs[0] and hasattr(aggs[0], 'close'):
            current_stock_price = aggs[0].close
            print(f"Current stock price: {current_stock_price}")
            return Response({"current_stock_price": current_stock_price}) # Test point 1
        else:
            error_message = f"Could not retrieve current stock price for {ticker_symbol} from Polygon.io."
            print(f"Error: {error_message}")
            return Response({"error": error_message}, status=404)

    except Exception as e:
        error_message = f"Error fetching stock price: {str(e)}"
        print(f"Exception caught: {error_message}")
        return Response({"error": error_message}, status=500)
    

@api_view(['GET'])
def get_option_contracts_alpaca(request):
    
    ticker_symbol = request.query_params.get('underlying_symbols', None)

    if not ticker_symbol:
        return Response({"error": "underlying_symbols parameter is required."}, status=400)

    try:
        data_client = StockHistoricalDataClient(settings.ALPACA_API_KEY, settings.ALPACA_SECRET_KEY)
        latest_trade_request = StockLatestTradeRequest(symbol_or_symbols=[ticker_symbol])
        latest_trade_data = data_client.get_stock_latest_trade(request_params=latest_trade_request)

        latest_trade = latest_trade_data.get(ticker_symbol)
        if latest_trade and hasattr(latest_trade, 'price'):
            current_stock_price = latest_trade.price
        else:
            return Response({"error": f"Could not retrieve latest stock trade price for {ticker_symbol}."}, status=404)

        base_url = settings.ALPACA_BASE_URL
        options_endpoint = "/v2/options/contracts"
        headers = {
            "accept": "application/json",
            "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY
        }
        options_params = {
            "underlying_symbols": ticker_symbol,
            "limit": 1000
        }
        options_response = requests.get(f"{base_url}{options_endpoint}", params=options_params, headers=headers)
        options_response.raise_for_status()
        options_data = options_response.json()

        all_contracts = options_data.get("option_contracts", [])
        all_contracts = options_data.get("option_contracts", [])
        put_contracts = [c for c in all_contracts if c.get("type") == "put"]

        if not put_contracts:
            return Response({"error": f"No put options found for {ticker_symbol}."}, status=404)

        atm_strike = min(
            put_contracts,
            key=lambda x: abs(float(x.get("strike_price", 0)) - current_stock_price)
        ).get("strike_price", 0)

        if atm_strike is not None:
            atm_strike = float(atm_strike)
        lower_bound = atm_strike - (10 * abs(atm_strike * 0.05))
        upper_bound = atm_strike + (10 * abs(atm_strike * 0.05))

        closest_strikes = sorted([
            c for c in put_contracts
            if lower_bound <= float(c.get("strike_price", 0)) and float(c.get("strike_price", 0)) <= upper_bound
        ], key=lambda x: abs(float(x.get("strike_price", 0)) - current_stock_price))[:21]

        unique_expiration_dates = sorted(list(set([c.get("expiration_date") for c in put_contracts])))
        today = datetime.now().date()
        next_expiration_dates = [
            date for date in unique_expiration_dates
            if datetime.strptime(date, '%Y-%m-%d').date() >= today
        ][:8]

        print("Reached the final Response in try block")  # Debugging line
        return Response({
            "at_the_money_strike_price": atm_strike,
            "closest_strike_prices": sorted(list(set([c['strike_price'] for c in closest_strikes]))),
            "next_expiration_dates": next_expiration_dates,
        })

    except requests.exceptions.RequestException as e:
        print(f"Request Exception: {e}")  # Debugging line
        return Response({"error": f"Error fetching data from Alpaca: {str(e)}"}, status=500)
    except Exception as e:
        print(f"General Exception: {e}")  # Debugging line
        return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=500)
    


###### These API calls were not used ######
@api_view(['GET'])
def get_put_options_data(request):
    ticker_symbol = request.query_params.get('ticker', None)
    if not ticker_symbol:
        return Response({"error": "Ticker symbol is required."}, status=400)

    base_url = "https://paper-api.alpaca.markets"
    endpoint = "/v2/options/contracts"
    params = {
        "underlying_symbols": ticker_symbol,
        "type": "put",
        "limit": 1000  # Adjust limit as needed
    }
    headers = {
        "accept": "application/json",
        "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY
    }

    try:
        response = requests.get(f"{base_url}{endpoint}", params=params, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        data = response.json()

        # Print the raw JSON response to the console
        print("\n--- Alpaca API Response (Raw JSON) ---")
        print(json.dumps(data, indent=4))
        print("---------------------------------------\n")

        option_contracts = data.get("option_contracts", [])
        results = []
        for contract in option_contracts:
            results.append({
                'symbol': contract.get('symbol'),
                'strike_price': float(contract.get('strike_price', 0)),
                'expiration_date': contract.get('expiration_date'),
                # Add other relevant fields as needed
            })
        return Response(results)

    except requests.exceptions.RequestException as e:
        error_message = f"Error fetching data from Alpaca: {str(e)}"
        print(f"\n--- Error: {error_message} ---\n")
        return Response({"error": error_message}, status=500)
    except Exception as e:
        unexpected_error = f"An unexpected error occurred: {str(e)}"
        print(f"\n--- Error: {unexpected_error} ---\n")
        return Response({"error": unexpected_error}, status=500)


@api_view(['POST'])
def calculate_put_metrics(request):
    print("\n--- Received request.data ---")
    print(request.data)
    print("-----------------------------\n")

    required_params = ['ticker_symbol', 'stock_price', 'strike_price', 'option_premium', 'expiration_date_str']
    missing = [param for param in required_params if param not in request.data]

    if missing:
        return Response({"error": f"Missing required parameters: {', '.join(missing)}"}, status=400)

    try:
        stock_price = float(request.data.get('stock_price'))
        strike_price = float(request.data.get('strike_price'))
        option_premium = float(request.data.get('option_premium'))
        number_of_contracts = int(request.data.get('number_of_contracts', 1))
        expiration_date = datetime.strptime(request.data.get('expiration_date_str'), '%Y-%m-%d').date()

        today = datetime.now().date()
        days_to_expiration = (expiration_date - today).days
        if days_to_expiration < 0:
            return Response({"error": "Expiration date cannot be in the past."}, status=400)

        results = {
            'ticker_symbol': request.data.get('ticker_symbol'),
            'stock_price': stock_price,
            'strike_price': strike_price,
            'option_premium': option_premium,
            'expiration_date': request.data.get('expiration_date_str'),
            'drop_percentage': round(((stock_price - strike_price) / stock_price) * 100, 2) if stock_price else 0,
            'breakeven_price': round(strike_price - option_premium, 2),
            'premium_collected': round(option_premium * number_of_contracts * 100, 2),
            'days_to_expiration': days_to_expiration,
            'return_at_expiration': round((option_premium / strike_price) * 100, 2) if strike_price else 0,
            'premium_annualized': round((((option_premium / strike_price) * 100) * 365) / days_to_expiration, 2) if days_to_expiration > 0 and strike_price else 0,
        }
        return Response(results)

    except ValueError as e:
        print(f"\n--- ValueError occurred: {e} ---\n")
        return Response({"error": "Invalid input format for numeric or date fields."}, status=400)
    except Exception as e:
        return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=500)