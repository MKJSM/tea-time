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
use chrono::Utc;
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
    let exists = sqlx::query("SELECT 1 FROM users WHERE email = $1")
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
    let user_id = Uuid::new_v4().to_string(); // Keep using Rust UUID generation or let DB handle it. Rust generated is fine and safe.
    let phone = payload.phone.unwrap_or_default();

    // Use Postgres parameter syntax $n
    // id is UUID type in DB, but we are binding String. sqlx handles this if we use Uuid type or if we cast?
    // In Postgres, if column is UUID, we should bind Uuid type.
    // Let's parse user_id string to Uuid for binding.
    let user_uuid =
        Uuid::parse_str(&user_id).map_err(|e| AppError::InternalServerError(e.to_string()))?;

    sqlx::query(
        "INSERT INTO users (id, name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(user_uuid)
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&phone)
    .bind(&password_hash)
    .execute(&state.db)
    .await?;

    // 4. Fetch Full User
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_uuid)
        .fetch_one(&state.db)
        .await?;

    // 5. Create Session
    let auth_user = AuthUser {
        id: user.id,
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

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
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

    // Update last_login_at
    sqlx::query("UPDATE users SET last_login_at = $1 WHERE id = $2")
        .bind(Utc::now())
        .bind(user.id)
        .execute(&state.db)
        .await?;

    // Login (create session)
    let auth_user = AuthUser {
        id: user.id,
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
            let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
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

    let user_id = user.id.to_string();
    state
        .session_store
        .delete_by_user(&user_id)
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

    let user_id = user.id.to_string();
    // Securely delete session only if it belongs to the current user
    let rows_affected = state
        .session_store
        .delete_session_for_user(&payload.session_id, &user_id)
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
    use crate::domain::models::User;
    use crate::infrastructure::session_store::PostgresSessionStore;
    use crate::state::AppState;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
    };
    use sqlx::migrate::MigrateDatabase;
    use sqlx::postgres::PgPoolOptions;
    use sqlx::{PgPool, Postgres};
    use tower::ServiceExt;

    async fn setup_test_db() -> PgPool {
        dotenvy::dotenv().ok();
        // Use DATABASE_URL from env or default
        let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgres://mobiletea:mobiletea2025@localhost/mobiletea".to_string()
        });

        let mut url_parts: Vec<&str> = database_url.split('/').collect();
        let _db_name = url_parts.pop().unwrap();
        let base_url = url_parts.join("/");

        // Create unique DB name
        let test_db_name = format!("mobiletea_test_{}", Uuid::new_v4().simple());
        let test_db_url = format!("{}/{}", base_url, test_db_name);

        // Connect to base to create DB
        // Note: Postgres::create_database requires connection to 'postgres' or similar.
        // sqlx handles this by connecting to 'postgres' database if possible when url has no db?
        // Actually sqlx MigrateDatabase::create_database does the job.

        match Postgres::create_database(&test_db_url).await {
            Ok(_) => (),
            Err(e) => {
                // If creation fails, it might be due to permissions or connection issues.
                // Fallback to using the main DB if testing environment is restricted?
                // No, that's dangerous. Panic.
                eprintln!("Failed to create test DB {}: {}", test_db_url, e);
                // Try to continue, maybe it exists?
            }
        }

        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&test_db_url)
            .await
            .expect("Failed to connect to test database");

        // Run migrations
        // Path is relative to Cargo.toml (backend/Cargo.toml)
        sqlx::migrate!("./db/migration")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        pool
    }

    async fn setup_test_app(pool: PgPool) -> Router {
        let session_store = PostgresSessionStore::new(pool.clone());
        session_store
            .migrate()
            .await
            .expect("Failed to migrate session store");

        let state = AppState::new_mock(pool, session_store).await;

        crate::handlers::build_router(state)
    }

    #[tokio::test]
    async fn test_signup() {
        let pool = setup_test_db().await;
        let app = setup_test_app(pool.clone()).await;

        let payload = CreateUserRequest {
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
            phone: Some("1234567890".to_string()),
        };

        let request = Request::builder()
            .method("POST")
            .uri("/api/auth/signup")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&payload).unwrap()))
            .unwrap();

        let response = app.oneshot(request).await.unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // Verify user in DB
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
            .bind("test@example.com")
            .fetch_one(&pool)
            .await
            .unwrap();

        assert_eq!(user.name, "Test User");

        // Clean up? (Optional, but good for local dev)
        // In CI, we destroy the container. Locally, we might leave junk DBs.
        // Dropping DB inside test is tricky because pool is connected.
        // We rely on external cleanup or ignore it for now.
        pool.close().await;
    }
}
