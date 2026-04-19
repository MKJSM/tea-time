use backend_db::{connect, migrate, DatabaseConfig};
use deadpool_postgres::Pool;
use std::net::SocketAddr;

mod config;
mod routes;
mod state;

use config::Config;
use state::{AppState, RazorpayConfig};

async fn initialize_database(config: &Config) -> Pool {
    let db = connect(&DatabaseConfig {
        database_url: config.database_url.clone(),
        db_pool_size: config.db_pool_size,
    })
    .await
    .unwrap_or_else(|error| panic!("failed to connect to postgres: {error}"));

    migrate(&db)
        .await
        .unwrap_or_else(|error| panic!("failed to run migrations: {error:?}"));

    backend_admin::ensure_default_admin(
        &db,
        &config.default_admin_email,
        &config.default_admin_password,
    )
    .await
    .unwrap_or_else(|error| panic!("failed to seed default admin: {error}"));

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

    let razorpay = RazorpayConfig {
        key_id: config.razorpay_key_id.clone(),
        key_secret: config.razorpay_key_secret.clone(),
        webhook_secret: config.razorpay_webhook_secret.clone(),
    };
    let mut s3_loader =
        aws_config::defaults(aws_config::BehaviorVersion::latest()).region(
            aws_sdk_s3::config::Region::new(config.s3_region.clone()),
        );
    if let Some(endpoint) = &config.s3_endpoint {
        s3_loader = s3_loader.endpoint_url(endpoint);
    }
    let s3_config = s3_loader.load().await;
    let s3_client = aws_sdk_s3::Client::new(&s3_config);

    let app = routes::build_router(AppState {
        db,
        http_client: reqwest::Client::new(),
        razorpay,
        s3_client,
        s3_bucket: config.s3_bucket.clone(),
        s3_public_url: config.s3_public_url.clone(),
        max_upload_size: config.max_upload_size,
    });

    let addr = SocketAddr::from(([127, 0, 0, 1], config.server_port));
    tracing::info!("listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind tcp listener");

    axum::serve(listener, app)
        .await
        .expect("server exited unexpectedly");
}
