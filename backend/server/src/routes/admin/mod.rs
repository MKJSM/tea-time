pub mod auth;
pub mod banner;
pub mod category;
pub mod dashboard;
pub mod order;
pub mod payment;
pub mod product;
pub mod user;

use axum::Router;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", axum::routing::get(dashboard::health))
        .nest("/auth", auth::router())
        .nest("/banners", banner::router())
        .nest("/categories", category::router())
        .nest("/products", product::router())
        .nest("/users", user::router())
        .nest("/orders", order::router())
        .nest("/payments", payment::router())
}
