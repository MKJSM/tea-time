use axum::{extract::{Path, State}, routing::{get, patch}, Json, Router};
use backend_shared::AppError;

use crate::state::AppState;

#[derive(serde::Deserialize)]
struct StatusInput {
    status: String,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/{id}", get(detail))
        .route("/{id}/status", patch(update_status))
}

async fn list(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(backend_order::list_orders_admin(&state.db).await?))
}

async fn detail(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<backend_order::OrderDetail>, AppError> {
    Ok(Json(backend_order::get_order_admin(&state.db, &id).await?))
}

async fn update_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<StatusInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    backend_order::update_order_status(&state.db, &id, &input.status).await?;
    Ok(Json(serde_json::json!({"ok": true})))
}
