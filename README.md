# Tea Haven - E-Commerce Platform

A complete e-commerce solution for selling tea, coffee, and customizable beverages.

## Architecture

*   **Frontend:** React (Vite), TypeScript, Tailwind CSS
*   **Backend:** Rust (Axum), SQLx, SQLite
*   **Database:** SQLite (Embedded)

## Prerequisites

Ensure you have the following installed on your system:

*   **Rust:** [Install Rust](https://www.rust-lang.org/tools/install)
*   **Node.js & npm** or **Bun:** [Install Bun](https://bun.sh/) (Recommended for frontend speed)
*   **Just:** [Install Just](https://github.com/casey/just) (Optional command runner, makes things easier)

## Quick Start (Recommended)

If you have `just` installed, you can use the provided `justfile` to automate tasks.

### 1. Run the Full Application (Dev Mode)

To build the frontend, deploy assets to the backend, and start the server:

```bash
just run
```

This will:
1.  Install frontend dependencies.
2.  Build the frontend.
3.  Copy frontend assets (`dist/`) to the backend (`backend/static/` and `backend/templates/`).
4.  Start the backend server.

Access the application at: `http://localhost:3001`

### 2. Seed the Database (Optional)

To populate the database with initial product data (after running the app once to create the DB):

```bash
just seed
```

## Manual Setup

If you prefer running commands manually or don't have `just`.

### Backend Setup

The backend handles the API and serves the static frontend files in production/integrated mode.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Configuration:**
    Ensure a `.env` file exists with the following content (default provided):
    ```env
    DATABASE_URL=sqlite://db.sqlite
    PORT=3001
    ```

3.  **Run the Server:**
    ```bash
    cargo run
    ```
    *   The server will automatically create the SQLite database and run migrations on startup.
    *   Server runs on `http://localhost:3001`.

### Frontend Setup (Development)

For active frontend development with hot-reloading:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Dependencies:**
    ```bash
    bun install
    # or
    npm install
    ```

3.  **Start Dev Server:**
    ```bash
    bun dev
    # or
    npm run dev
    ```
    *   Access the frontend dev server (usually `http://localhost:5173`).
    *   **Note:** You may need to ensure the frontend is pointing to the correct backend API URL if running separately.

## Deployment / Build

To create a production-ready build where the backend serves the frontend:

1.  **Build Frontend:**
    ```bash
    cd frontend
    bun run build
    ```

2.  **Copy Assets:**
    *   Copy `frontend/dist/index.html` to `backend/templates/index.stpl`.
    *   Copy `frontend/dist/assets/*` to `backend/static/assets/`.

3.  **Build Backend (Release):**
    ```bash
    cd backend
    cargo build --release
    ```

4.  **Run Binary:**
    ```bash
    ./backend/target/release/backend
    ```

## Project Structure

*   `backend/`: Rust Axum API server.
    *   `src/`: Source code.
    *   `db/`: Database migrations and seeds.
    *   `static/`: Served static files (images, CSS, JS).
    *   `templates/`: HTML templates (index.html).
*   `frontend/`: React Vite application.
    *   `src/`: Source components, pages, and logic.

## Documentation

See `requirement.md` for detailed business requirements and user flows.
