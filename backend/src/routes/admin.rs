use axum::{extract::State, routing::get, Json, Router};

use crate::{libs::error::AppError, libs::shared::map_pool_error_to_app_error, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .nest("/auth", Router::new().route("/health", get(auth_health)))
}

async fn health(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    let client = state.db.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_one("SELECT 1", &[]).await?;
    let db_ok: i32 = row.get(0);

    Ok(Json(serde_json::json!({
        "ok": true,
        "scope": "admin",
        "database": db_ok == 1
    })))
}

async fn auth_health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "ok": true,
        "scope": "admin_auth",
        "session_cookie": crate::libs::session::ADMIN_SESSION_COOKIE
    }))
}
