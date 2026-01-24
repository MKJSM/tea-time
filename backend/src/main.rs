use axum::{
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use sailfish::TemplateOnce;
use sqlx::migrate::MigrateDatabase;
use sqlx::{sqlite::SqlitePoolOptions, Sqlite};
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use std::net::SocketAddr;
use crate::state::AppState;

mod config;
mod domain;
mod error;
mod handlers;
mod state;

#[derive(TemplateOnce)]
#[template(path = "index.stpl")]
struct IndexTemplate;

#[tokio::main]
async fn main() {
    // initialize tracing
    tracing_subscriber::fmt::init();

    // load config
    let config = config::Config::from_env();

    println!("Current Dir: {:?}", std::env::current_dir());
    println!("Using database url: {}", config.database_url);

    // Check if database exists, if not create it
    if !Sqlite::database_exists(&config.database_url).await.unwrap_or(false) {
        println!("Database does not exist. Creating...");
        match Sqlite::create_database(&config.database_url).await {
            Ok(_) => println!("Create db success"),
            Err(error) => panic!("error: {}", error),
        }
    } else {
        println!("Database exists");
    }

    // connect to database
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to the database");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let state = AppState { db: pool };

    // build our application with a route
    let app = Router::new()
        // API routes
        // Allow CORS
        .layer(CorsLayer::permissive())
        .route("/api/auth/signup", axum::routing::post(handlers::auth::signup))
        .route("/api/auth/login", axum::routing::post(handlers::auth::login))
        .route("/api/auth/logout", axum::routing::post(handlers::auth::logout))
        .route("/api/auth/me", get(handlers::auth::get_me))
        .route("/api/products", get(handlers::products::get_products))
        .route("/api/products/:id", get(handlers::products::get_product_by_id))
        .route("/api/products/:id/customizations", get(handlers::products::get_product_customizations))
        .route("/api/favorites", get(handlers::favorites::list_favorites))
        .route("/api/favorites/ids", get(handlers::favorites::get_favorite_ids))
        .route("/api/products/:id/favorite", 
            axum::routing::post(handlers::favorites::add_favorite)
            .delete(handlers::favorites::remove_favorite)
        )
        .with_state(state)
        // Serve static files from backend/static/assets
        .nest_service("/assets", ServeDir::new("static/assets"))
        // Route for the root and fallback for SPA
        .route("/", get(index_handler))
        .fallback(index_handler);

    // run our app
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    println!("Listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn index_handler() -> impl IntoResponse {
    let ctx = IndexTemplate;
    match ctx.render_once() {
        Ok(html) => Html(html),
        Err(err) => {
            eprintln!("Template rendering error: {}", err);
            Html("Internal Server Error".to_string())
        }
    }
}