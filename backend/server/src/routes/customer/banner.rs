use axum::{extract::State, Json, Router};

use backend_shared::AppError;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", axum::routing::get(list))
}

async fn list(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(backend_banner::list_active(&state.db).await?))
}
