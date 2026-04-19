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
just build-frontend
just frontend-build
just copy-frontend
just sync-frontend
just setup
just migrate
just reset
just run-backend
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
DATABASE_URL=postgres://mobiletea:mobiletea@localhost:5432/mobiletea
DATABASE_POOL_SIZE=5
PORT=3001
```

## Recommended backend flow

1. Start PostgreSQL and run `just setup`.
2. Create `backend/.env` with `DATABASE_URL` and optional `DATABASE_POOL_SIZE`.
3. Run `just migrate` to apply SQL files from `backend/db/migration`.
4. Run `just run-backend` to start only the backend.

`just setup` drops and recreates the local `mobiletea` database and `mobiletea` role with password `mobiletea`.
It connects to the local PostgreSQL admin database as `postgres` on `localhost:5432`.

To fully recreate the configured database from scratch, run `just reset`.

## Frontend build and serving

- customer app builds into `frontend/dist/customer`
- admin app builds into `frontend/dist/admin`
- `just sync-frontend` copies:
  - customer build to `backend/server/public/`
  - admin build to `backend/server/public/admin/`
- `just copy-frontend` is an alias for `just sync-frontend`
- backend serves:
  - customer app at `/`
  - admin app at `/admin`

## Full app flow

- `just run`
  Builds both frontend apps, copies them into `backend/server/public`, then starts the backend server.

- `just all`
  Builds both frontend apps, copies the customer app into `backend/server/public/`, copies the admin app into `backend/server/public/admin/`, then starts the backend server.
