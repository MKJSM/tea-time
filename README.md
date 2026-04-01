# Tea Time

Minimal full-stack scaffold:

- `frontend/`: React + Vite app
- `backend/`: Rust + Axum app
- `backend/public/`: deployed frontend build output served by backend
- `backend/db/migration/`: PostgreSQL migrations

## Requirements

- Node.js and npm
- Rust toolchain
- PostgreSQL

## Commands

```bash
just frontend-install
just frontend-build
just sync-frontend
just migrate
just build-backend
just backend-run
just run
just all
```

## Backend configuration

The backend now requires PostgreSQL before it can start.

Copy `backend/.env.example` values into your environment or `.env` file before running the backend.

Example:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tea_time
DATABASE_POOL_SIZE=5
PORT=3001
```

## Recommended backend flow

1. Start PostgreSQL and create the target database.
2. Export `DATABASE_URL` and optional `DATABASE_POOL_SIZE`.
3. Run `just migrate` to apply SQL files from `backend/db/migration`.
4. Run `just backend-run` to start only the backend.

## Full app flow

- `just run`
  Builds the frontend, copies `frontend/dist` into `backend/public`, then starts the backend.

- `just all`
  Same as `just run`: builds the frontend, syncs the frontend build into the backend public directory, and starts the backend server.
