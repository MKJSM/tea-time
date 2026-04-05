use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};

use crate::state::AppState;
use backend_session::{cookie_name, lookup_subject_id, SessionScope};
use backend_shared::AppError;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .route("/login", post(login))
        .route("/me", get(me))
}

async fn health() -> Json<serde_json::Value> {
    Json(backend_admin::auth_health())
}

async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(input): Json<backend_admin::LoginInput>,
) -> Result<(CookieJar, Json<backend_admin::AuthResponse>), AppError> {
    let (response, session) = backend_admin::login(&state.db, input).await?;
    Ok((with_session_cookie(jar, session.value), Json(response)))
}

async fn me(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<Json<backend_admin::AuthResponse>, AppError> {
    let token = jar
        .get(cookie_name(SessionScope::Admin))
        .map(|cookie| cookie.value().to_string())
        .ok_or_else(|| AppError::Unauthorized("admin session is missing".to_string()))?;
    let admin_id = lookup_subject_id(&state.db, SessionScope::Admin, &token)
        .await?
        .ok_or_else(|| AppError::Unauthorized("admin session is invalid".to_string()))?;

    Ok(Json(backend_admin::me(&state.db, admin_id).await?))
}

fn with_session_cookie(jar: CookieJar, session_token: String) -> CookieJar {
    let cookie = Cookie::build((cookie_name(SessionScope::Admin), session_token))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .build();

    jar.add(cookie)
}
