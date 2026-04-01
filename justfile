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

# Copy the frontend build output into the backend public directory.
sync-frontend:
    mkdir -p backend/server/public/admin
    rm -rf backend/server/public/*
    mkdir -p backend/server/public/admin
    cp -R frontend/dist/customer/. backend/server/public/
    cp -R frontend/dist/admin/. backend/server/public/admin/

# Run backend SQL migrations against PostgreSQL.
migrate:
    cargo run --manifest-path backend/server/Cargo.toml -- --migrate-only

# Start only the backend server. Requires PostgreSQL and DATABASE_URL.
backend-run:
    cargo run --manifest-path backend/server/Cargo.toml

# Build frontend, copy it into backend/public, then start the backend.
run: frontend-build sync-frontend
    cargo run --manifest-path backend/server/Cargo.toml

# Alias for the full frontend-build + sync + backend-start flow.
all: frontend-build sync-frontend
    cargo run --manifest-path backend/server/Cargo.toml

# Start the frontend dev server only.
dev-frontend:
    cd frontend/apps/customer && npm run dev

# Build only the backend binary.
build-backend:
    cargo build --manifest-path backend/server/Cargo.toml

# Build frontend, sync static output, and compile the backend.
build: frontend-build sync-frontend build-backend
