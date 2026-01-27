pub mod addresses;
pub mod auth;
pub mod cart;
pub mod favorites;
pub mod files;
pub mod orders;
pub mod pages;
pub mod products;
pub mod user;

use crate::state::AppState;
use axum::http::Request;
use axum::{
    extract::DefaultBodyLimit,
    routing::{delete, get, post, put},
    Router,
};
use pages::index_handler;
use std::net::IpAddr;
use std::sync::Arc;
use tower_governor::{
    governor::GovernorConfigBuilder,
    key_extractor::{KeyExtractor, SmartIpKeyExtractor},
    GovernorError, GovernorLayer,
};
use tower_http::trace::TraceLayer;
use tower_sessions::{Expiry, SessionManagerLayer};

/// Custom key extractor that falls back to a default IP for rate limiting
/// This allows tests to work while still providing rate limiting in production
#[derive(Clone)]
pub struct SafeIpKeyExtractor;

impl KeyExtractor for SafeIpKeyExtractor {
    type Key = IpAddr;

    fn extract<T>(&self, req: &Request<T>) -> Result<Self::Key, GovernorError> {
        // Try to use SmartIpKeyExtractor first
        SmartIpKeyExtractor
            .extract(req)
            // Fall back to localhost if IP extraction fails (e.g., in tests)
            .or_else(|_| Ok(IpAddr::V4(std::net::Ipv4Addr::new(127, 0, 0, 1))))
    }
}

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

    // Rate limiting for auth endpoints: 10 requests per 60 seconds per IP
    // This prevents brute force attacks and credential stuffing
    let auth_rate_limit_config = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(60)
            .burst_size(10)
            .key_extractor(SafeIpKeyExtractor)
            .finish()
            .expect("Failed to create rate limit config"),
    );

    // Auth routes with rate limiting
    let auth_routes = Router::new()
        .route("/signup", post(auth::signup))
        .route("/login", post(auth::login))
        .route("/logout", post(auth::logout))
        .route("/logout/all", post(auth::logout_all))
        .route("/logout/device", post(auth::logout_device))
        .route("/me", get(auth::get_me))
        .layer(GovernorLayer::new(auth_rate_limit_config));

    // Cart Routes
    let cart_routes = Router::new()
        .route("/", get(cart::get_cart))
        .route("/", post(cart::add_to_cart))
        .route("/merge", post(cart::merge_cart))
        .route("/items/{id}", put(cart::update_cart_item))
        .route("/items/{id}", delete(cart::remove_cart_item));

    // Address Routes
    let address_routes = Router::new()
        .route("/", get(addresses::list_addresses))
        .route("/", post(addresses::create_address))
        .route("/{id}", get(addresses::get_address))
        .route("/{id}", put(addresses::update_address))
        .route("/{id}", delete(addresses::delete_address))
        .route("/{id}/default", post(addresses::set_default_address));

    // User Routes
    let user_routes = Router::new()
        .route("/profile", get(user::get_user_profile))
        .route("/profile", put(user::update_user_profile))
        .route("/password", post(user::change_password))
        .route("/theme", put(user::update_theme))
        .route("/devices", get(user::get_user_devices))
        .nest("/addresses", address_routes);

    // Order Routes
    let order_routes = Router::new()
        .route("/", get(orders::list_orders))
        .route("/", post(orders::create_order))
        .route("/{id}", get(orders::get_order))
        .route("/{id}/pay", post(orders::initiate_payment))
        .route("/{id}/cancel", post(orders::cancel_order));

    // Payment Routes
    let payment_routes = Router::new()
        .route("/", get(orders::list_payments))
        .route("/verify", post(orders::verify_payment))
        .route("/{id}", get(orders::get_payment));

    // Webhook Routes
    let webhook_routes = Router::new().route("/razorpay", post(orders::handle_razorpay_webhook));

    // File Upload Routes
    let upload_routes = Router::new()
        .route("/image", post(files::upload_image))
        .layer(DefaultBodyLimit::max(state.max_upload_size));

    Router::new()
        // Auth Routes (with rate limiting)
        .nest("/api/auth", auth_routes)
        // User Routes
        .nest("/api/user", user_routes)
        // Webhook Routes (No auth)
        .nest("/api/webhooks", webhook_routes)
        // Upload Routes
        .nest("/api/upload", upload_routes)
        // Products Routes
        .route("/api/products", get(products::get_products))
        .route("/api/products/categories", get(products::get_categories))
        .route("/api/products/{id}", get(products::get_product_by_id))
        .route(
            "/api/products/{id}/customizations",
            get(products::get_product_customizations),
        )
        // Cart Routes
        .nest("/api/cart", cart_routes)
        // Address Routes (Legacy support or keep separate if preferred, but nested under user is better)
        // .nest("/api/addresses", address_routes)
        // Order Routes
        .nest("/api/orders", order_routes)
        // Payment Routes
        .nest("/api/payments", payment_routes)
        // Favorites Routes
        .route("/api/favorites", get(favorites::list_favorites))
        .route("/api/favorites/ids", get(favorites::get_favorite_ids))
        .route(
            "/api/products/{id}/favorite",
            post(favorites::add_favorite).delete(favorites::remove_favorite),
        )
        // File Routes
        .route("/api/files/upload", post(files::upload_image))
        // Middleware
        .layer(TraceLayer::new_for_http())
        .layer(session_layer)
        .with_state(state)
        // Static & SPA Fallback
        .nest_service(
            "/assets",
            tower::ServiceBuilder::new()
                .layer(tower_http::set_header::SetResponseHeaderLayer::overriding(
                    axum::http::header::CACHE_CONTROL,
                    axum::http::HeaderValue::from_static("public, max-age=31536000, immutable"),
                ))
                .service(tower_http::services::ServeDir::new("static/assets")),
        )
        .nest_service(
            "/favicon.ico",
            tower_http::services::ServeFile::new("static/favicon.ico"),
        )
        .route("/", get(index_handler))
        .fallback(index_handler)
}
