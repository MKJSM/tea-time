pub mod addresses;
pub mod auth;
pub mod cart;
pub mod favorites;
pub mod pages;
pub mod products;

use crate::state::AppState;
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use pages::index_handler;
use tower_http::trace::TraceLayer;
use tower_sessions::{Expiry, SessionManagerLayer};

pub fn build_router(state: AppState) -> Router {
    // Determine if we're in production based on environment
    let is_production = std::env::var("ENVIRONMENT")
        .map(|e| e.to_lowercase() == "production")
        .unwrap_or(false);

    // Session Layer - secure cookies in production
    let session_layer = SessionManagerLayer::new(state.session_store.clone())
        .with_secure(is_production)
        .with_expiry(Expiry::OnInactivity(time::Duration::days(30)))
        .with_http_only(true)
        .with_same_site(tower_sessions::cookie::SameSite::Lax);

    // Auth routes with rate limiting
    let auth_routes = Router::new()
        .route("/signup", post(auth::signup))
        .route("/login", post(auth::login))
        .route("/logout", post(auth::logout))
        .route("/logout/all", post(auth::logout_all))
        .route("/logout/device", post(auth::logout_device))
        .route("/me", get(auth::get_me));

    // Cart Routes
    let cart_routes = Router::new()
        .route("/", get(cart::get_cart))
        .route("/", post(cart::add_to_cart))
        .route("/merge", post(cart::merge_cart))
        .route("/items/:id", put(cart::update_cart_item))
        .route("/items/:id", delete(cart::remove_cart_item));

    // Address Routes
    let address_routes = Router::new()
        .route("/", get(addresses::list_addresses))
        .route("/", post(addresses::create_address))
        .route("/:id", get(addresses::get_address))
        .route("/:id", put(addresses::update_address))
        .route("/:id", delete(addresses::delete_address))
        .route("/:id/default", post(addresses::set_default_address));

    Router::new()
        // Auth Routes (with rate limiting)
        .nest("/api/auth", auth_routes)
        // Products Routes
        .route("/api/products", get(products::get_products))
        .route("/api/products/categories", get(products::get_categories))
        .route("/api/products/:id", get(products::get_product_by_id))
        .route(
            "/api/products/:id/customizations",
            get(products::get_product_customizations),
        )
        // Cart Routes
        .nest("/api/cart", cart_routes)
        // Address Routes
        .nest("/api/addresses", address_routes)
        // Favorites Routes
        .route("/api/favorites", get(favorites::list_favorites))
        .route("/api/favorites/ids", get(favorites::get_favorite_ids))
        .route(
            "/api/products/:id/favorite",
            post(favorites::add_favorite).delete(favorites::remove_favorite),
        )
        // Middleware
        .layer(TraceLayer::new_for_http())
        .layer(session_layer)
        .with_state(state)
        // Static & SPA Fallback
        .nest_service(
            "/assets",
            tower_http::services::ServeDir::new("static/assets"),
        )
        .nest_service(
            "/favicon.ico",
            tower_http::services::ServeFile::new("static/favicon.ico"),
        )
        .nest_service(
            "/logo.png",
            tower_http::services::ServeFile::new("static/logo.png"),
        )
        .route("/", get(index_handler))
        .fallback(index_handler)
}
