# Stage 1: Build Frontend
FROM oven/bun:1 AS frontend-builder
WORKDIR /app/frontend

# Copy package files
COPY frontend/package.json frontend/bun.lockb* ./
# Install dependencies
RUN bun install --frozen-lockfile

# Copy source and build
COPY frontend/ .
RUN bun run build

# Stage 2: Build Backend
FROM rust:slim-bookworm AS backend-builder
WORKDIR /app/backend

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy manifests first for better caching
COPY backend/Cargo.toml backend/Cargo.lock ./

# Copy source code and templates
COPY backend/src ./src
COPY backend/templates ./templates
COPY backend/db/migration ./db/migration

# Create static directory
RUN mkdir -p static/assets

# Copy schema if needed
COPY backend/schema.sql ./

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist/assets ./static/assets

# Copy index.html as index.stpl (Vite already handles asset hashing in index.html)
COPY --from=frontend-builder /app/frontend/dist/index.html ./templates/index.stpl

# Build the release binary
RUN cargo build --release

# Stage 3: Runtime
FROM debian:bookworm-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates libssl3 sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy the binary
COPY --from=backend-builder /app/backend/target/release/backend /app/teatime-backend

# Copy static assets and templates (templates might be needed if using Sailfish at runtime, although compiled in, sometimes good to keep structure if code references paths)
# Sailfish compiles templates into the binary, so we strictly don't need the templates folder at runtime unless dynamically reloading.
# But we DO need the static assets served by ServeDir
COPY --from=backend-builder /app/backend/static /app/static

# Create directory for database
RUN mkdir -p /app/data

# Environment variables
ENV PORT=3000
ENV DATABASE_URL=sqlite:///app/data/db.sqlite
ENV RUST_LOG=info

# Expose the port
EXPOSE 3000

# Run the binary
CMD ["/app/teatime-backend"]
