# Teatime Project Justfile
set dotenv-load

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

# Watch for changes and restart server using the cargo alias
watch:
    @echo "Starting server in watch mode..."
    cd backend && cargo watch -q -c -w src -w static -w templates -x run

# 'all' is an alias for 'run'
all: run

# Apply database migrations
migrate:
    @echo "Applying migrations..."
    cd backend && cargo sqlx migrate run
    @echo "Migrations applied."

# Create database and user (requires psql to be connected to a server with permission to create DBs/users)
db-create:
    @echo "Creating database and user..."
    psql postgres -f backend/db/setup.sql
    @echo "Database and user created."

# Seed the database with initial data
seed:
    @echo "Seeding database..."
    if [ -f backend/.env ]; then set -a; . ./backend/.env; set +a; fi; \
    psql "$DATABASE_URL" -f backend/db/data/seed.sql
    @echo "Database seeded."

# Setup database (migrate + seed)
db-setup: migrate seed
    @echo "Database setup complete."
