use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};

use backend_shared::AppError;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{id}", get(get_one).patch(update).delete(remove))
}

async fn list(State(state): State<AppState>) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(backend_category::list(&state.db).await?))
}

async fn get_one(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<backend_category::CategoryListItem>, AppError> {
    Ok(Json(backend_category::get(&state.db, &id).await?))
}

async fn create(
    State(state): State<AppState>,
    Json(input): Json<backend_category::CategoryInput>,
) -> Result<Json<backend_category::CategoryListItem>, AppError> {
    Ok(Json(backend_category::create(&state.db, input).await?))
}

async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<backend_category::CategoryInput>,
) -> Result<Json<backend_category::CategoryListItem>, AppError> {
    Ok(Json(backend_category::update(&state.db, &id, input).await?))
}

async fn remove(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    backend_category::delete(&state.db, &id).await?;
    Ok(Json(serde_json::json!({"ok": true})))
}
