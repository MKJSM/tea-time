use axum::{
    extract::{Path, Query, State},
    routing::get,
    Json, Router,
};

use backend_shared::AppError;

use crate::state::AppState;

#[derive(serde::Deserialize)]
struct ProductListQuery {
    category_id: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/{id}", get(get_one))
}

async fn list(
    State(state): State<AppState>,
    Query(query): Query<ProductListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(
        backend_product::list(&state.db, query.category_id.as_deref()).await?,
    ))
}

async fn get_one(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<backend_product::ProductDetail>, AppError> {
    Ok(Json(backend_product::get(&state.db, &id).await?))
}
