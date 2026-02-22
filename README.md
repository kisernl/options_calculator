# Options Calculator - Full-Stack Web Application

This project is a full-stack web application built with a React frontend and a Django backend. It's designed to help options traders quickly analyze potential profitability and key metrics for common options trading strategies, initially focusing on **Cash-Secured Puts** and **Covered Calls**.

## Features

* **Real-time Stock Prices:** Fetches near real-time stock prices using the Finnhub API.
* **Cash-Secured Put Calculator:**
    * Calculates potential return on capital.
    * Determines the breakeven price.
    * Computes the annualized yield.
    * Shows the potential profit or loss at expiration.
* **Covered Call Calculator:**
    * Calculates the potential premium return.
    * Determines the total potential gain.
    * Shows the breakeven price (if assigned).
    * Computes the potential profit or loss at expiration.
* **User-Friendly Interface:** Built with React for a dynamic and intuitive user experience.
* **API-Driven Backend:** Django REST Framework handles API requests and data processing.

## Technologies Used

* **Frontend:**
    * React
    * TypeScript
    * Vite
    * Tailwind CSS
* **Backend:**
    * Python (3.13 or lower)
    * Django
    * Django REST Framework
    * Finnhub API

## Getting Started - Use It Yourself (Fork and Run Locally)

If you'd like to run a local copy of the Options Calculator for your own use, follow these steps:

**1. Fork the Repository:**

* On the GitHub page for this repository, click the **"Fork"** button in the top right corner. This will create a copy of the repository under your own GitHub account.

**2. Clone Your Fork:**

* Open your terminal or command prompt.
* Navigate to the directory where you want to clone the project.
* Run the following command, replacing `yourusername` with your GitHub username:

    ```bash
    git clone https://github.com/yourusername/options_calculator.git
    ```

**3. Navigate to the Project Directory:**

    ```bash
    cd options_calculator
    ```

**4. Set Up the Backend (Django):**

* Navigate to the backend directory:

    ```bash
    cd options_calc_backend
    ```
* **Create a Virtual Environment:**

    > **Note:** Python 3.14+ is not yet supported by some dependencies. Use Python 3.13 or lower.

    ```bash
    python3.13 -m venv venv
    source venv/bin/activate  # On macOS/Linux
    # venv\Scripts\activate  # On Windows
    ```
* **Install Dependencies:**

    ```bash
    pip install -r requirements.txt
    ```
* **Set Up Environment Variables:**

    Create a `.env` file in the `options_calc_backend` directory with the following:

    ```
    SECRET_KEY=your-django-secret-key-here
    FINNHUB_API_KEY=your-finnhub-api-key-here
    DEBUG=True
    ```

    * Generate a Django secret key by running:

        ```bash
        python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
        ```

    * Get a free Finnhub API key from [https://finnhub.io/](https://finnhub.io/).

* **Run Migrations:**

    ```bash
    python manage.py migrate
    ```
* **Start the Django Development Server:**

    ```bash
    python manage.py runserver
    ```

    The backend will be accessible at `http://localhost:8000`.

**5. Set Up the Frontend (React):**

* Open a new terminal or command prompt.
* Navigate to the frontend directory:

    ```bash
    cd options_calc_frontend
    ```
* **Install Dependencies:**

    ```bash
    npm install
    ```
* **Start the Vite Development Server:**

    ```bash
    npm run dev
    ```

    The frontend will be accessible at `http://localhost:5173`. The Vite dev server is pre-configured to proxy API requests to the Django backend at `localhost:8000`.

**6. Use the Application:**

* Open your web browser and navigate to `http://localhost:5173`. You should now be able to use the Options Calculator.
