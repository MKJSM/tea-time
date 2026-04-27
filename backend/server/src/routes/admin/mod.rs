pub mod auth;
pub mod banner;
pub mod category;
pub mod dashboard;
pub mod order;
pub mod payment;
pub mod product;
pub mod user;

use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Json, Response},
    Router,
};
use axum_extra::extract::CookieJar;
use backend_session::{cookie_name, lookup_subject_id, SessionScope};
use serde_json::json;

use crate::state::AppState;

async fn require_admin_session(
    State(state): State<AppState>,
    jar: CookieJar,
    request: Request,
    next: Next,
) -> Response {
    let token = jar
        .get(cookie_name(SessionScope::Admin))
        .map(|c| c.value().to_string());

    let Some(token) = token else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "admin session missing" })),
        )
            .into_response();
    };

    match lookup_subject_id(&state.db, SessionScope::Admin, &token).await {
        Ok(Some(_)) => next.run(request).await,
        _ => (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "admin session invalid or expired" })),
        )
            .into_response(),
    }
}

pub fn router(state: AppState) -> Router<AppState> {
    let protected = Router::new()
        .route("/health", axum::routing::get(dashboard::health))
        .nest("/banners", banner::router())
        .nest("/categories", category::router())
        .nest("/products", product::router())
        .nest("/users", user::router())
        .nest("/orders", order::router())
        .nest("/payments", payment::router())
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            require_admin_session,
        ));

    Router::new().nest("/auth", auth::router()).merge(protected)
}
