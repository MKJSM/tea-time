pub mod admin;
pub mod customer;

use axum::{routing::get, Router};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

use crate::state::AppState;

async fn admin_spa() -> axum::response::Html<String> {
    match tokio::fs::read_to_string("backend/server/public/admin/index.html").await {
        Ok(html) => axum::response::Html(html),
        Err(_) => axum::response::Html("Admin app not built".to_string()),
    }
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .merge(customer::router())
        .nest("/api/admin", admin::router())
        .route("/admin", get(admin_spa))
        .route("/admin/{*path}", get(admin_spa))
        .fallback_service(
            ServeDir::new("backend/server/public")
                .fallback(ServeFile::new("backend/server/public/index.html")),
        )
        .with_state(state)
        .layer(TraceLayer::new_for_http())
}
