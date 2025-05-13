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
    * JavaScript
    * HTML
    * CSS
* **Backend:**
    * Python
    * Django
    * Django REST Framework
    * Finnhub API

## Getting Started - Use It Yourself (Fork and Run Locally)

If you'd like to run a local copy of the Options Calculator for your own use, follow these steps:

**1. Fork the Repository:**

* On the GitHub page for this repository (`github.com/yourusername/your-repository-name`), click the **"Fork"** button in the top right corner. This will create a copy of the repository under your own GitHub account.

**2. Clone Your Fork:**

* Open your terminal or command prompt.
* Navigate to the directory where you want to clone the project.
* Run the following command, replacing `yourusername` with your GitHub username:

    ```bash
    git clone [https://github.com/yourusername/your-repository-name.git](https://github.com/yourusername/your-repository-name.git)
    ```

**3. Navigate to the Project Directory:**

    ```bash
    cd your-repository-name
    ```

**4. Set Up the Backend (Django):**

* Navigate to the `backend` directory:

    ```bash
    cd backend
    ```
* **Create a Virtual Environment (Recommended):**

    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On macOS/Linux
    # venv\Scripts\activate  # On Windows
    ```
* **Install Dependencies:**

    ```bash
    pip install -r requirements.txt
    ```
* **Set Up Finnhub API Key:**
    * You'll need a free API key from Finnhub ([https://finnhub.io/](https://finnhub.io/)).
    * Once you have your API key, you can either:
        * Set it as an environment variable named `FINNHUB_API_KEY` on your system.
        * Create a `.env` file in the `backend` directory and add:

            ```
            FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY_HERE
            ```

            You might need to install the `python-dotenv` package (`pip install python-dotenv`) and load it in your Django settings if you choose this method.
* **Run Migrations:**

    ```bash
    python manage.py migrate
    ```
* **Start the Django Development Server:**

    ```bash
    python manage.py runserver
    ```

    The backend will usually be accessible at `http://localhost:8000`.

**5. Set Up the Frontend (React):**

* Open a new terminal or command prompt.
* Navigate to the `frontend` directory within your project:

    ```bash
    cd frontend
    ```
* **Install Dependencies:**

    ```bash
    npm install  # or yarn install
    ```
* **Configure Backend API URL:**
    * In the `frontend` directory, create a `.env.development.local` file (if it doesn't exist).
    * Add the following line, ensuring it points to your running Django development server:

        ```
        REACT_APP_BACKEND_URL=http://localhost:8000/api
        ```
* **Start the React Development Server:**

    ```bash
    npm start  # or yarn start
    ```

    The frontend will usually be accessible at `http://localhost:3000`.

**6. Use the Application:**

* Open your web browser and navigate to `http://localhost:3000`. You should now be able to use the Options Calculator.
