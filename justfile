# Teatime Project Justfile

# Default command to run if no command is specified
default: all

# --- Individual Commands ---

# Build the frontend and copy the assets to the backend directory.
deploy-frontend:
    @echo "Building frontend..."
    cd frontend && bun install && bun run build
    @echo "Deploying to backend..."
    mkdir -p backend/static/assets
    mkdir -p backend/templates
    # Copy index.html as the template
    cp frontend/dist/index.html backend/templates/index.stpl
    # Copy assets
    cp -r frontend/dist/assets/* backend/static/assets/
    @echo "Frontend assets deployed."

# Build the backend in release mode.
build-backend:
    @echo "Building backend..."
    cd backend && cargo build --release

# --- Combined Commands ---

# Deploy command: Build frontend, move assets, build backend
deploy: deploy-frontend build-backend
    @echo "Deployment build complete."

# Run command: Deploy then run the backend (dev mode mostly, or release)
# Using cargo run for convenience
run: deploy-frontend
    @echo "Starting server..."
    cd backend && cargo run

# 'all' is an alias for 'run'
all: run
