use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use backend_shared::AppError;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/{id}", get(detail))
}

async fn list(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(backend_payment::list_admin(&state.db).await?))
}

async fn detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(backend_payment::get_admin(&state.db, &id).await?))
}
