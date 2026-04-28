pub mod admin;
pub mod customer;

use axum::{
    extract::Request,
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Router,
};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

use crate::state::AppState;

async fn customer_spa() -> Html<String> {
    match tokio::fs::read_to_string("backend/server/public/index.html").await {
        Ok(html) => Html(html),
        Err(_) => match tokio::fs::read_to_string("frontend/dist/customer/index.html").await {
            Ok(html) => Html(html),
            Err(_) => Html("Customer app not built".to_string()),
        },
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
        .route(
            "/api/webhooks/razorpay",
            post(customer::payment::handle_webhook),
        )
        .nest("/api/admin", admin::router(state.clone()))
        .nest_service(
            "/admin",
            ServeDir::new("backend/server/public/admin")
                .not_found_service(ServeFile::new("backend/server/public/admin/index.html")),
        )
        .nest_service("/assets", ServeDir::new("backend/server/public/assets"))
        .route("/", get(customer_spa))
        .fallback(get(app_fallback))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
}
