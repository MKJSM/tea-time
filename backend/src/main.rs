use backend::{config::Config, libs::db, routes, state::AppState};
use deadpool_postgres::Pool;
use std::net::SocketAddr;

async fn initialize_database(config: &Config) -> Pool {
    let db = db::connect(config)
        .await
        .unwrap_or_else(|error| panic!("failed to connect to postgres: {error}"));

    db::migrate(&db)
        .await
        .unwrap_or_else(|error| panic!("failed to run migrations: {error}"));

    db
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
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
