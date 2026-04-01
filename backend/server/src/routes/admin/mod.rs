pub mod auth;
pub mod category;
pub mod dashboard;
pub mod product;

use axum::Router;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", axum::routing::get(dashboard::health))
        .nest("/auth", auth::router())
        .nest("/categories", category::router())
        .nest("/products", product::router())
}
