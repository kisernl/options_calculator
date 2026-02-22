# options_calc backend

## Setup

1. Create a virtual environment (requires Python 3.13 or lower):

    ```bash
    python3.13 -m venv venv
    source venv/bin/activate
    ```

2. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3. Create a `.env` file in this directory with the following variables:

    ```
    SECRET_KEY=your-django-secret-key-here
    FINNHUB_API_KEY=your-finnhub-api-key-here
    DEBUG=True
    ```

    Generate a secret key with:

    ```bash
    python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
    ```

4. Run migrations and start the server:

    ```bash
    python manage.py migrate
    python manage.py runserver
    ```

## Finnhub API

MVP with Realtime Stock Price: https://finnhub.io/docs/api/quote

## Alpaca Bug Note

Weird paper trading bug in Alpaca API - have to create a new paper trading account and generate keys for that new account, then the API should work.
