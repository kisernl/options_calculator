# put_calculator/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('options/puts/', views.get_put_options_data, name='get_put_options_data'),
    path('options/puts/calculate/', views.calculate_put_metrics, name='calculate_put_metrics'),
    path('options/contracts/alpaca/', views.get_option_contracts_alpaca, name='get_option_contracts_alpaca'),
    path('options/contracts/polygon/', views.get_option_contracts_polygon, name='get_option_contracts_polygon'),
    path('test/polygon/options/', views.test_polygon_options, name='test_polygon_options'),
    path('simple/test/', views.simple_test, name='simple_test'),
    path('quote/polygon/', views.get_last_quote_polygon, name='get_last_quote_polygon'),
    path('quote/finnhub/', views.get_finnhub_quote, name='get_finnhub_quote'), # Add this line
]
