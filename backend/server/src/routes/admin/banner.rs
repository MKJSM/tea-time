use axum::{extract::{Path, State}, routing::{get, patch}, Json, Router};

use backend_shared::AppError;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/:id", patch(update).delete(remove))
}

async fn list(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(backend_banner::list_admin(&state.db).await?))
}

async fn create(State(state): State<AppState>, Json(input): Json<backend_banner::BannerInput>) -> Result<Json<backend_banner::Banner>, AppError> {
    Ok(Json(backend_banner::create(&state.db, input).await?))
}

async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<backend_banner::BannerInput>,
) -> Result<Json<backend_banner::Banner>, AppError> {
    Ok(Json(backend_banner::update(&state.db, &id, input).await?))
}

async fn remove(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<serde_json::Value>, AppError> {
    backend_banner::delete(&state.db, &id).await?;
    Ok(Json(serde_json::json!({"ok": true})))
}
