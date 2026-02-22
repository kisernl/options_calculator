# Options Calculator Frontend

React + TypeScript frontend built with Vite and Tailwind CSS.

## Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Start the development server:

    ```bash
    npm run dev
    ```

    The app will be available at `http://localhost:5173`.

## API Proxy

The Vite dev server is configured to proxy `/api` requests to the Django backend at `http://localhost:8000`. No additional configuration is needed — just make sure the backend is running.

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run format` - Format code
- `npm run preview` - Preview the production build
