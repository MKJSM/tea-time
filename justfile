# Teatime Project Justfile

# Default command to run if no command is specified
default: all

# --- Individual Commands ---

# Build the frontend and copy the assets to the backend directory.
# This installs dependencies and then runs the deploy script.
copy-frontend:
    @echo "Building and deploying frontend..."
    cd frontend && npm install && npm run copy

# Build the backend in release mode.
# This implicitly depends on 'copy-frontend' because the backend compilation
# requires the 'index.stpl' template to exist.
build-backend:
    @echo "Building backend..."
    cd backend && cargo build --release

# --- Combined Commands ---

# Build both the frontend and backend.
build: copy-frontend build-backend
    @echo "Frontend and backend built successfully."

# Build everything and run the backend server.
run: build
    @echo "Starting server..."
    cd backend && ./target/release/backend

# 'all' is an alias for 'run' to provide a single command to get started.
all: run
