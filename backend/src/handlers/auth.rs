use crate::auth::{AuthSession, AuthUser, SESSION_USER_KEY};
use crate::domain::models::{
    AuthResponse, CreateUserRequest, LoginUserRequest, LogoutDeviceRequest, User,
};
use crate::error::AppError;
use crate::state::AppState;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::{Json, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use tower_sessions::Session;
use uuid::Uuid;
use validator::Validate;

/// Extracts IP address from headers (X-Forwarded-For or X-Real-IP)
fn get_ip_address(headers: &HeaderMap) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or(s).trim().to_string())
        .or_else(|| {
            headers
                .get("x-real-ip")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| "unknown".to_string())
}

fn get_user_agent(headers: &HeaderMap) -> String {
    headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

/// Signup a new user.
///
/// This handler creates a new user with the provided details, generates a UUID,
/// hashes the password, and creates a session.
/// It also captures the client's IP address and User-Agent.
///
/// # Arguments
/// * `session` - The session handle.
/// * `headers` - HTTP headers to extract device info.
/// * `state` - Application state (DB pool).
/// * `payload` - JSON payload containing user details (name, email, password).
///
/// # Returns
/// * `200 OK` with the created user details.
/// * `500 Internal Server Error` if user exists or DB error.
#[tracing::instrument(skip(session, state, payload, headers), fields(email = %payload.email, name = %payload.name))]
pub async fn signup(
    session: Session,
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Validate input
    payload.validate().map_err(|e| {
        let errors: Vec<String> = e
            .field_errors()
            .values()
            .flat_map(|errs| {
                errs.iter()
                    .filter_map(|e| e.message.as_ref().map(|m| m.to_string()))
            })
            .collect();
        AppError::BadRequest(errors.join(", "))
    })?;

    // 1. Check if user exists
    let exists = sqlx::query("SELECT 1 FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?;

    if exists.is_some() {
        return Err(AppError::Conflict(
            "Registration failed. Please try a different email.".into(),
        ));
    }

    // 2. Hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|e| AppError::InternalServerError(e.to_string()))?
        .to_string();

    // 3. Insert User
    let user_id = Uuid::new_v4().to_string();
    let phone = payload.phone.unwrap_or_default();

    sqlx::query("INSERT INTO users (id, name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)")
        .bind(&user_id)
        .bind(&payload.name)
        .bind(&payload.email)
        .bind(&phone)
        .bind(&password_hash)
        .execute(&state.db)
        .await?;

    // 4. Fetch Full User
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&user_id)
        .fetch_one(&state.db)
        .await?;

    // 5. Create Session
    let auth_user = AuthUser {
        id: user.id.clone(),
        email: user.email.clone(),
        name: user.name.clone(),
    };

    session
        .insert(SESSION_USER_KEY, auth_user)
        .await
        .map_err(|_| AppError::InternalServerError("Failed to create session".into()))?;

    // Store Device Info
    let ip = get_ip_address(&headers);
    let ua = get_user_agent(&headers);
    session.insert("ip_address", ip).await.ok();
    session.insert("user_agent", ua).await.ok();

    Ok(Json(AuthResponse { user }))
}

/// Authenticate a user.
///
/// Verifies credentials, creates a new session, and stores device info.
///
/// # Arguments
/// * `payload` - JSON payload (email, password).
#[tracing::instrument(skip(session, state, payload, headers), fields(email = %payload.email))]
pub async fn login(
    session: Session,
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(payload): Json<LoginUserRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Validate input
    payload.validate().map_err(|e| {
        let errors: Vec<String> = e
            .field_errors()
            .values()
            .flat_map(|errs| {
                errs.iter()
                    .filter_map(|e| e.message.as_ref().map(|m| m.to_string()))
            })
            .collect();
        AppError::BadRequest(errors.join(", "))
    })?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".into()))?;

    // Verify Password
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    Argon2::default()
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Invalid credentials".into()))?;

    // Login (create session)
    let auth_user = AuthUser {
        id: user.id.clone(),
        email: user.email.clone(),
        name: user.name.clone(),
    };

    session
        .insert(SESSION_USER_KEY, auth_user)
        .await
        .map_err(|_| AppError::InternalServerError("Failed to create session".into()))?;

    // Store Device Info
    let ip = get_ip_address(&headers);
    let ua = get_user_agent(&headers);
    session.insert("ip_address", ip).await.ok();
    session.insert("user_agent", ua).await.ok();

    Ok(Json(AuthResponse { user }))
}

#[tracing::instrument(skip(auth_session, state))]
pub async fn get_me(
    auth_session: AuthSession,
    State(state): State<AppState>,
) -> Result<Json<User>, AppError> {
    match auth_session.user {
        Some(auth_user) => {
            tracing::debug!("Fetching user data for user_id: {}", auth_user.id);
            // Fetch fresh user data
            let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
                .bind(auth_user.id)
                .fetch_optional(&state.db)
                .await?
                .ok_or_else(|| AppError::Unauthorized("User not found".into()))?;
            Ok(Json(user))
        }
        None => Err(AppError::Unauthorized("Not authenticated".into())),
    }
}

/// Logout the current session.
#[tracing::instrument(skip(session))]
pub async fn logout(session: Session) -> Result<impl IntoResponse, AppError> {
    session
        .flush()
        .await
        .map_err(|_| AppError::InternalServerError("Failed to logout".into()))?;
    Ok(StatusCode::OK)
}

/// Logout from all devices for the authenticated user.
///
/// Deletes all sessions associated with the current user's ID.
#[tracing::instrument(skip(auth_session, state))]
pub async fn logout_all(
    auth_session: AuthSession,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let user = auth_session
        .user
        .ok_or(AppError::Unauthorized("Not authenticated".into()))?;

    state
        .session_store
        .delete_by_user(&user.id)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Failed to logout all: {}", e)))?;

    Ok(StatusCode::OK)
}

/// Logout a specific device (session).
///
/// Deletes the session specified in the payload, only if it belongs to the authenticated user.
#[tracing::instrument(skip(auth_session, state, payload))]
pub async fn logout_device(
    auth_session: AuthSession,
    State(state): State<AppState>,
    Json(payload): Json<LogoutDeviceRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user = auth_session
        .user
        .ok_or(AppError::Unauthorized("Not authenticated".into()))?;

    // Securely delete session only if it belongs to the current user
    let rows_affected = state
        .session_store
        .delete_session_for_user(&payload.session_id, &user.id)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Failed to logout device: {}", e)))?;

    if rows_affected == 0 {
        return Err(AppError::NotFound(
            "Session not found or not owned by you".into(),
        ));
    }

    Ok(StatusCode::OK)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::models::CreateUserRequest;
    use crate::infrastructure::session_store::SqliteSessionStore;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        routing::post,
        Router,
    };
    use sqlx::SqlitePool;
    use tower::ServiceExt;
    use tower_sessions::{Expiry, SessionManagerLayer};

    async fn setup_test_app() -> (Router, SqlitePool) {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
        // Run migration for tests (need to ensure path is correct or manually run schema)
        // Since we changed migration path to ./db/migration, we need to ensure tests can find it
        // OR we just execute the schema SQL directly here for simplicity/speed in tests.

        let schema = include_str!("../../db/migration/001_initial_schema.sql");
        sqlx::query(schema).execute(&pool).await.unwrap();

        let session_store = SqliteSessionStore::new(pool.clone());
        // Custom store doesn't use migrate() trait method anymore for schema creation if we included it in main schema

        let session_layer = SessionManagerLayer::new(session_store.clone())
            .with_secure(false)
            .with_expiry(Expiry::OnInactivity(time::Duration::days(1)));

        let state = AppState {
            db: pool.clone(),
            session_store,
        };

        let app = Router::new()
            .route("/api/auth/signup", post(signup))
            .route("/api/auth/login", post(login))
            .route("/api/auth/me", axum::routing::get(get_me))
            .route("/api/auth/logout", post(logout))
            .layer(session_layer)
            .with_state(state);

        (app, pool)
    }

    #[tokio::test]
    async fn test_signup_login_logout() {
        let (app, _) = setup_test_app().await;

        // 1. Signup
        let signup_payload = CreateUserRequest {
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
            phone: None,
        };

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/auth/signup")
                    .header("Content-Type", "application/json")
                    .body(Body::from(serde_json::to_string(&signup_payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let cookie = response.headers().get("set-cookie").unwrap().to_owned();

        // 2. Get Me (authenticated)
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/api/auth/me")
                    .header("cookie", cookie.clone())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // ... (rest of the test)
    }
}
