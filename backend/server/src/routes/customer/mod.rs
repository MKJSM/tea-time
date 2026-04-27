pub mod address;
pub mod auth;
pub mod banner;
pub mod cart;
pub mod category;
pub mod file;
pub mod health;
pub mod order;
pub mod payment;
pub mod product;
pub mod profile;

use axum::Router;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/health", axum::routing::get(health::service_health))
        .nest("/api/banners", banner::router())
        .nest("/api/auth", auth::router())
        .nest("/api/customer", profile::router())
        .nest("/api/addresses", address::router())
        .nest("/api/cart", cart::router())
        .nest("/api/orders", order::router())
        .nest("/api/payments", payment::router())
        .nest("/api/files", file::router())
        .nest("/api/categories", category::router())
        .nest("/api/products", product::router())
}
