# Tea Time

Workspace scaffold with separate backend and frontend package boundaries.

## Structure

- `backend/server/`: backend binary crate
- `backend/libs/`: feature library crates
- `backend/crates/`: shared backend infrastructure crates
- `backend/db/migration/`: PostgreSQL migrations
- `frontend/apps/customer/`: customer frontend app
- `frontend/apps/admin/`: admin frontend app
- `frontend/packages/`: shared frontend packages

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

Copy `backend/.env.example` to `backend/.env` or export equivalent variables before running the backend.

Example:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tea_time
DATABASE_POOL_SIZE=5
PORT=3001
```

## Recommended backend flow

1. Start PostgreSQL and create the target database.
2. Create `backend/.env` with `DATABASE_URL` and optional `DATABASE_POOL_SIZE`.
3. Run `just migrate` to apply SQL files from `backend/db/migration`.
4. Run `just backend-run` to start only the backend.

## Frontend build and serving

- customer app builds into `frontend/dist/customer`
- admin app builds into `frontend/dist/admin`
- `just sync-frontend` copies:
  - customer build to `backend/server/public/`
  - admin build to `backend/server/public/admin/`
- backend serves:
  - customer app at `/`
  - admin app at `/admin`

## Full app flow

- `just run`
  Builds both frontend apps, copies them into `backend/server/public`, then starts the backend server.

- `just all`
  Same as `just run`: builds both frontend apps, syncs them into the backend public directory, and starts the backend server.
