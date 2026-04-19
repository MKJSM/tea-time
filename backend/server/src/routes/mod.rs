pub mod admin;
pub mod customer;

use axum::{
    extract::Request,
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

use crate::state::AppState;

async fn customer_spa() -> Html<String> {
    match tokio::fs::read_to_string("frontend/dist/customer/index.html").await {
        Ok(html) => Html(html),
        Err(_) => Html("Customer app not built".to_string()),
    }
}

async fn app_fallback(request: Request) -> Response {
    if request.uri().path().starts_with("/api/") {
        return StatusCode::NOT_FOUND.into_response();
    }

    customer_spa().await.into_response()
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .merge(customer::router())
        .nest("/api/admin", admin::router())
        .nest_service(
            "/admin",
            ServeDir::new("frontend/dist/admin")
                .not_found_service(ServeFile::new("frontend/dist/admin/index.html")),
        )
        .nest_service("/assets", ServeDir::new("frontend/dist/customer/assets"))
        .route("/", get(customer_spa))
        .fallback(get(app_fallback))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
}
