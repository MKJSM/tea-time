set shell := ["zsh", "-lc"]

default: run

# Install frontend dependencies.
frontend-install:
    cd frontend && npm install

# Build the customer app.
frontend-build-customer: frontend-install
    cd frontend && npm run build:customer

# Build the admin app.
frontend-build-admin: frontend-install
    cd frontend && npm run build:admin

# Build both frontend apps.
frontend-build: frontend-install
    cd frontend && npm run build

# Alias for building the frontend apps.
build-frontend: frontend-build

# Copy the frontend build output into the backend public directory.
sync-frontend:
    mkdir -p backend/server/public/admin
    rm -rf backend/server/public/*
    mkdir -p backend/server/public/admin
    cp -R frontend/dist/customer/. backend/server/public/
    cp -R frontend/dist/admin/. backend/server/public/admin/

# Alias for syncing the built frontend into the backend public directory.
copy-frontend: sync-frontend

# Run backend SQL migrations against PostgreSQL.
migrate:
    set -a; source backend/.env; set +a; cargo run --manifest-path backend/server/Cargo.toml -- --migrate-only

# Recreate the local mobiletea PostgreSQL role and database.
setup:
    db_name="mobiletea"; db_user="mobiletea"; db_password="mobiletea"; \
    admin_url="postgresql://postgres@localhost:5432/postgres"; \
    psql "$admin_url" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db_name' AND pid <> pg_backend_pid();" && \
    psql "$admin_url" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$db_name\";" && \
    psql "$admin_url" -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$db_user') THEN EXECUTE format('DROP OWNED BY %I', '$db_user'); END IF; END \$\$;" && \
    psql "$admin_url" -v ON_ERROR_STOP=1 -c "DROP ROLE IF EXISTS \"$db_user\";" && \
    psql "$admin_url" -v ON_ERROR_STOP=1 -c "CREATE ROLE \"$db_user\" WITH ENCRYPTED PASSWORD '$db_password' CREATEDB CREATEROLE LOGIN;" && \
    psql "$admin_url" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$db_name\" WITH OWNER \"$db_user\" ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0;" && \
    psql "postgresql://postgres@localhost:5432/$db_name" -v ON_ERROR_STOP=1 -c "GRANT USAGE, CREATE ON SCHEMA public TO \"$db_user\";" && \
    psql "$admin_url" -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE \"$db_name\" TO \"$db_user\";"

# Drop and recreate the configured database, then rerun migrations.
reset: setup
    set -a; source backend/.env; set +a; cargo run --manifest-path backend/server/Cargo.toml -- --migrate-only

# Start only the backend server. Requires PostgreSQL and DATABASE_URL.
backend-run:
    set -a; source backend/.env; set +a; cargo run --manifest-path backend/server/Cargo.toml

# Alias for starting the backend server.
run-backend: backend-run

# Build frontend, copy it into backend/public, then start the backend.
run: frontend-build sync-frontend
    set -a; source backend/.env; set +a; cargo run --manifest-path backend/server/Cargo.toml

# Build both frontend apps, copy them into the backend public directory, then start the backend.
all: build-frontend copy-frontend
    set -a; source backend/.env; set +a; cargo run --manifest-path backend/server/Cargo.toml

# Start the frontend dev server only.
dev-frontend:
    cd frontend/apps/customer && npm run dev

# Build only the backend binary.
build-backend:
    cargo build --manifest-path backend/server/Cargo.toml

# Build frontend, sync static output, and compile the backend.
build: frontend-build sync-frontend build-backend
