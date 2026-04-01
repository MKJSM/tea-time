use axum::{extract::State, Json};

use backend_shared::AppError;

use crate::state::AppState;

pub async fn health(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(backend_admin::health(&state.db).await?))
}
