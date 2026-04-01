use backend_db::{connect, migrate, DatabaseConfig};
use deadpool_postgres::Pool;
use std::net::SocketAddr;

mod config;
mod routes;
mod state;

use config::Config;
use state::AppState;

async fn initialize_database(config: &Config) -> Pool {
    let db = connect(&DatabaseConfig {
        database_url: config.database_url.clone(),
        db_pool_size: config.db_pool_size,
    })
    .await
    .unwrap_or_else(|error| panic!("failed to connect to postgres: {error}"));

    migrate(&db)
        .await
        .unwrap_or_else(|error| panic!("failed to run migrations: {error}"));

    db
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend_server=debug,tower_http=debug".into()),
        )
        .init();

    let config = Config::from_env().unwrap_or_else(|error| {
        panic!("failed to load config: {error}. set DATABASE_URL before starting the backend")
    });
    let migrate_only = std::env::args().any(|arg| arg == "--migrate-only");

    let db = initialize_database(&config).await;

    if migrate_only {
        tracing::info!("database migrations completed");
        return;
    }

    let app = routes::build_router(AppState { db });

    let addr = SocketAddr::from(([127, 0, 0, 1], config.server_port));
    tracing::info!("listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind tcp listener");

    axum::serve(listener, app)
        .await
        .expect("server exited unexpectedly");
}
