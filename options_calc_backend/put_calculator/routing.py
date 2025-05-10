from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/options/(?P<symbol>[\w-]+)/$', consumers.OptionPriceConsumer.as_asgi()),
    # Add this catch-all route to handle invalid paths
    re_path(r'.*', consumers.InvalidPathConsumer.as_asgi()),
]