# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ .
RUN npm run build

# Stage 2: Build Backend
FROM rust:1.81-slim-bookworm AS backend-builder
WORKDIR /app/backend

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy manifests first for better caching
COPY backend/Cargo.toml backend/Cargo.lock ./

# Copy source code and templates
COPY backend/src ./src
COPY backend/templates ./templates
COPY backend/migrations ./migrations
COPY backend/static ./static
# Copy schema if needed (though migrations usually handle it)
COPY backend/schema.sql ./

# Copy built frontend assets to backend static directory (for runtime serving)
COPY --from=frontend-builder /app/frontend/dist/assets ./static/assets

# Update index.stpl with new asset filenames
# We use a temporary shell script to find the files and update the template
COPY --from=frontend-builder /app/frontend/dist/assets /tmp/assets
RUN JS_FILE=$(ls /tmp/assets/*.js | head -n 1 | xargs basename) && \
    CSS_FILE=$(ls /tmp/assets/*.css | head -n 1 | xargs basename) && \
    echo "Updating template with JS: $JS_FILE and CSS: $CSS_FILE" && \
    sed -i "s|src=\"/assets/.*\.js\"|src=\"/assets/$JS_FILE\"|" templates/index.stpl && \
    sed -i "s|href=\"/assets/.*\.css\"|href=\"/assets/$CSS_FILE\"|" templates/index.stpl

# Build the release binary
RUN cargo build --release

# Stage 3: Runtime
FROM debian:bookworm-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates libssl3 sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy the binary
COPY --from=backend-builder /app/backend/target/release/backend /app/teatime-backend

# Copy static assets (frontend build)
COPY --from=backend-builder /app/backend/static /app/static

# Create directory for database (if using volume)
RUN mkdir -p /app/data

# Environment variables
ENV PORT=3000
ENV DATABASE_URL=sqlite:///app/data/db.sqlite
ENV RUST_LOG=info

# Expose the port
EXPOSE 3000

# Run the binary
CMD ["/app/teatime-backend"]
