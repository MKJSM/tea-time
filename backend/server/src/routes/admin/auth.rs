use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};

use crate::state::AppState;
use backend_session::{cookie_name, delete_session, lookup_subject_id, SessionScope};
use backend_shared::AppError;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .route("/login", post(login))
        .route("/me", get(me))
        .route("/logout", post(logout))
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

async fn logout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, Json<serde_json::Value>), AppError> {
    let cookie_name = cookie_name(SessionScope::Admin);
    let maybe_token = jar.get(cookie_name).map(|cookie| cookie.value().to_string());

    if let Some(token) = maybe_token {
        delete_session(&state.db, SessionScope::Admin, &token).await?;
    }

    Ok((without_session_cookie(jar, SessionScope::Admin), Json(serde_json::json!({
        "ok": true,
        "scope": "admin_auth",
        "logged_out": true,
    }))))
}

fn with_session_cookie(jar: CookieJar, session_token: String) -> CookieJar {
    let cookie = Cookie::build((cookie_name(SessionScope::Admin), session_token))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .build();

    jar.add(cookie)
}

fn without_session_cookie(jar: CookieJar, scope: SessionScope) -> CookieJar {
    jar.remove(Cookie::build((cookie_name(scope), "")).path("/").build())
}
