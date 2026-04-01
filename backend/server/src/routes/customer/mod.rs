pub mod auth;
pub mod category;
pub mod health;
pub mod product;
pub mod profile;

use axum::Router;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/health", axum::routing::get(health::service_health))
        .nest("/api/auth", auth::router())
        .nest("/api/customer", profile::router())
        .nest("/api/categories", category::router())
        .nest("/api/products", product::router())
}
