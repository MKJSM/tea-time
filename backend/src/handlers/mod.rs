pub mod auth;
pub mod favorites;
pub mod pages;
pub mod products;

use crate::state::AppState;
use axum::{
    routing::{get, post},
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

    Router::new()
        // Auth Routes (with rate limiting)
        .nest("/api/auth", auth_routes)
        // Products Routes
        .route("/api/products", get(products::get_products))
        .route("/api/products/:id", get(products::get_product_by_id))
        .route(
            "/api/products/:id/customizations",
            get(products::get_product_customizations),
        )
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
        .route("/", get(index_handler))
        .fallback(index_handler)
}
