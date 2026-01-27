use axum::http::{header, Method};
use backend::infrastructure::session_store::PostgresSessionStore;
use backend::state::{AppState, RazorpayConfig};
use backend::{config, handlers};
use sqlx::migrate::MigrateDatabase;
use sqlx::{postgres::PgPoolOptions, Postgres};
use std::net::SocketAddr;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // Ensure logs directory exists
    std::fs::create_dir_all("logs").expect("Failed to create logs directory");

    let file_appender = tracing_appender::rolling::daily("logs", "server.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    // initialize tracing with JSON format and EnvFilter
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug,axum::rejection=trace".into()),
        )
        .with(
            tracing_subscriber::fmt::layer()
                .json()
                .with_writer(non_blocking),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // load config
    let config = config::Config::from_env();

    tracing::debug!("Current Dir: {:?}", std::env::current_dir());
    tracing::info!("Starting server with database");

    // Check if database exists, if not create it
    if !Postgres::database_exists(&config.database_url)
        .await
        .unwrap_or(false)
    {
        tracing::info!("Database does not exist. Creating...");
        match Postgres::create_database(&config.database_url).await {
            Ok(_) => tracing::info!("Database created successfully"),
            Err(error) => panic!("Failed to create database: {}", error),
        }
    }

    // connect to database with optimized pool settings
    let pool = PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .min_connections(2)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to the database");

    // Run migrations if enabled
    if config.run_migrations {
        tracing::info!("Running database migrations...");
        sqlx::migrate!("./db/migration")
            .run(&pool)
            .await
            .expect("Failed to run migrations");
    } else {
        tracing::info!("Skipping database migrations (RUN_MIGRATIONS=false)");
    }

    // Session Store (Custom) - auto-creates table if not exists
    let session_store = PostgresSessionStore::new(pool.clone());
    session_store
        .migrate()
        .await
        .expect("Failed to initialize session store");

    // Background task for session cleanup
    let store_clone = session_store.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600)); // Every hour
        loop {
            interval.tick().await;
            if let Err(e) = tower_sessions::ExpiredDeletion::delete_expired(&store_clone).await {
                tracing::error!("Failed to clean up expired sessions: {}", e);
            }
        }
    });

    let razorpay = std::sync::Arc::new(RazorpayConfig {
        key_id: config.razorpay_key_id,
        key_secret: config.razorpay_key_secret,
        webhook_secret: config.razorpay_webhook_secret,
    });

    // Initialize S3 client
    let mut s3_config_loader = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(aws_sdk_s3::config::Region::new(config.s3_region.clone()));

    if let Some(endpoint) = &config.s3_endpoint {
        s3_config_loader = s3_config_loader.endpoint_url(endpoint);
    }

    let s3_config = s3_config_loader.load().await;
    let s3_client = aws_sdk_s3::Client::new(&s3_config);

    let state = AppState {
        db: pool,
        session_store,
        razorpay,
        s3_client,
        s3_bucket: config.s3_bucket,
        s3_public_url: config.s3_public_url,
        max_upload_size: config.max_upload_size,
    };

    // Configure CORS based on environment
    let cors = if config.is_production {
        // Production: Restrict to allowed origins
        let allowed_origins = config.allowed_origins.clone();
        CorsLayer::new()
            .allow_origin(AllowOrigin::list(
                allowed_origins.iter().filter_map(|o| o.parse().ok()),
            ))
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::DELETE,
                Method::PUT,
                Method::PATCH,
            ])
            .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::ACCEPT])
            .allow_credentials(true)
    } else {
        // Development: Permissive CORS
        CorsLayer::permissive()
    };

    // build our application with a route
    let app = handlers::build_router(state)
        .layer(cors)
        .layer(CompressionLayer::new());

    // run our app
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
