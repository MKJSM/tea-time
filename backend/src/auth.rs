use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json, RequestPartsExt,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tower_sessions::Session;

pub const SESSION_USER_KEY: &str = "auth-session-user";

/// User data stored in session - use this in handlers that need auth
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
}

/// Optional auth - extracts session and user if present
pub struct AuthSession {
    pub user: Option<AuthUser>,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthSession
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let session = parts.extract::<Session>().await.map_err(|e| {
            tracing::error!("Session extraction failed in AuthSession: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Session extraction failed",
            )
        })?;

        let user: Option<AuthUser> = session.get(SESSION_USER_KEY).await.map_err(|e| {
            tracing::error!("Failed to get user from session: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Session get failed")
        })?;

        Ok(AuthSession { user })
    }
}

/// Required auth user only - use when handler just needs user info (most common case)
///
/// Example usage:
/// ```rust
/// pub async fn list_favorites(
///     user: RequiredAuthUser,
///     State(state): State<AppState>,
/// ) -> Result<Json<Vec<Product>>, AppError> {
///     // user.id, user.email, user.name available directly
/// }
/// ```
pub struct RequiredAuthUser(pub AuthUser);

impl std::ops::Deref for RequiredAuthUser {
    type Target = AuthUser;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for RequiredAuthUser
where
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth_session = AuthSession::from_request_parts(parts, state)
            .await
            .map_err(|(status, msg)| (status, msg).into_response())?;

        match auth_session.user {
            Some(user) => Ok(RequiredAuthUser(user)),
            None => Err(unauthorized_response()),
        }
    }
}

/// Creates a consistent JSON unauthorized response
fn unauthorized_response() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": "Not authenticated" })),
    )
        .into_response()
}
