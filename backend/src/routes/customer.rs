use axum::{extract::State, routing::get, Json, Router};

use crate::{libs::error::AppError, libs::shared::map_pool_error_to_app_error, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/health", get(health))
        .nest(
            "/api/customer",
            Router::new().route("/health", get(customer_health)),
        )
        .nest(
            "/api/auth",
            Router::new().route("/health", get(auth_health)),
        )
}

async fn health(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    let client = state.db.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_one("SELECT 1", &[]).await?;
    let db_ok: i32 = row.get(0);

    Ok(Json(serde_json::json!({
        "ok": true,
        "service": "backend",
        "scope": "customer",
        "database": db_ok == 1
    })))
}

async fn customer_health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "ok": true,
        "scope": "customer"
    }))
}

async fn auth_health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "ok": true,
        "scope": "customer_auth",
        "session_cookie": crate::libs::session::CUSTOMER_SESSION_COOKIE
    }))
}
