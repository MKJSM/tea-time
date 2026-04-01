set shell := ["zsh", "-lc"]

default: run

frontend-install:
    cd frontend && npm install

frontend-build: frontend-install
    cd frontend && npm run build

sync-frontend:
    mkdir -p backend/public
    rm -rf backend/public/*
    cp -R frontend/dist/. backend/public/

backend-run:
    cd backend && cargo run

run: frontend-build sync-frontend
    cd backend && cargo run

all: frontend-build sync-frontend
    cd backend && cargo run

dev-frontend:
    cd frontend && npm run dev

build-backend:
    cd backend && cargo build

build: frontend-build sync-frontend build-backend
