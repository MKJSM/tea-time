use crate::infrastructure::session_store::SqliteSessionStore;
use crate::state::AppState;
use axum::http::{header, Method};
use sqlx::migrate::MigrateDatabase;
use sqlx::{sqlite::SqlitePoolOptions, Sqlite};
use std::net::SocketAddr;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod config;
mod domain;
mod error;
mod handlers;
mod infrastructure;
mod state;

#[tokio::main]
async fn main() {
    // initialize tracing with JSON format and EnvFilter
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug,axum::rejection=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // load config
    let config = config::Config::from_env();

    tracing::debug!("Current Dir: {:?}", std::env::current_dir());
    tracing::info!("Starting server with database");

    // Check if database exists, if not create it
    if !Sqlite::database_exists(&config.database_url)
        .await
        .unwrap_or(false)
    {
        tracing::info!("Database does not exist. Creating...");
        match Sqlite::create_database(&config.database_url).await {
            Ok(_) => tracing::info!("Database created successfully"),
            Err(error) => panic!("Failed to create database: {}", error),
        }
    }

    // connect to database with optimized pool settings
    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .min_connections(2)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to the database");

    // Run migrations
    sqlx::migrate!("./db/migration")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    // Session Store (Custom) - auto-creates table if not exists
    let session_store = SqliteSessionStore::new(pool.clone());
    session_store
        .migrate()
        .await
        .expect("Failed to initialize session store");

    let state = AppState {
        db: pool,
        session_store,
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
