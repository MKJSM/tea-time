pub mod admin;
pub mod customer;

use axum::Router;
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

use crate::state::AppState;

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .merge(customer::router())
        .nest("/api/admin", admin::router())
        .fallback_service(ServeDir::new("public").fallback(ServeFile::new("public/index.html")))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
}
