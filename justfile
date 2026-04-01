set shell := ["zsh", "-lc"]

default: run

# Install frontend dependencies.
frontend-install:
    cd frontend && npm install

# Build the frontend production bundle.
frontend-build: frontend-install
    cd frontend && npm run build

# Copy the frontend build output into the backend public directory.
sync-frontend:
    mkdir -p backend/public
    rm -rf backend/public/*
    cp -R frontend/dist/. backend/public/

# Run backend SQL migrations against PostgreSQL.
migrate:
    cd backend && cargo run -- --migrate-only

# Start only the backend server. Requires PostgreSQL and DATABASE_URL.
backend-run:
    cd backend && cargo run

# Build frontend, copy it into backend/public, then start the backend.
run: frontend-build sync-frontend
    cd backend && cargo run

# Alias for the full frontend-build + sync + backend-start flow.
all: frontend-build sync-frontend
    cd backend && cargo run

# Start the frontend dev server only.
dev-frontend:
    cd frontend && npm run dev

# Build only the backend binary.
build-backend:
    cd backend && cargo build

# Build frontend, sync static output, and compile the backend.
build: frontend-build sync-frontend build-backend
