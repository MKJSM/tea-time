use chrono::{Duration, Utc};
use deadpool_postgres::Pool;
use uuid::Uuid;

use backend_shared::{map_pool_error_to_app_error, AppError};

pub const CUSTOMER_SESSION_COOKIE: &str = "tea_time_customer_session";
pub const ADMIN_SESSION_COOKIE: &str = "tea_time_admin_session";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SessionScope {
    Customer,
    Admin,
}

pub fn cookie_name(scope: SessionScope) -> &'static str {
    match scope {
        SessionScope::Customer => CUSTOMER_SESSION_COOKIE,
        SessionScope::Admin => ADMIN_SESSION_COOKIE,
    }
}

impl SessionScope {
    pub fn as_db_value(self) -> &'static str {
        match self {
            SessionScope::Customer => "customer",
            SessionScope::Admin => "admin",
        }
    }
}

pub struct SessionToken {
    pub value: String,
}

pub async fn create_session(
    pool: &Pool,
    scope: SessionScope,
    subject_id: Uuid,
) -> Result<SessionToken, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let session_id = Uuid::new_v4();
    let session_token = Uuid::new_v4().to_string();
    let expires_on = (Utc::now() + Duration::days(30)).to_rfc3339();
    let subject_id = subject_id.to_string();

    client
        .execute(
            "INSERT INTO app_session (id, scope, subject_id, session_token, expires_on)
             VALUES ($1::uuid, $2, $3::uuid, $4, $5::timestamptz)",
            &[
                &session_id.to_string(),
                &scope.as_db_value(),
                &subject_id,
                &session_token,
                &expires_on,
            ],
        )
        .await?;

    Ok(SessionToken {
        value: session_token,
    })
}

pub async fn lookup_subject_id(
    pool: &Pool,
    scope: SessionScope,
    session_token: &str,
) -> Result<Option<Uuid>, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client
        .query_opt(
            "SELECT subject_id::text
             FROM app_session
             WHERE scope = $1
               AND session_token = $2
               AND expires_on > NOW()",
            &[&scope.as_db_value(), &session_token],
        )
        .await?;

    row.map(|row| {
        let subject_id: String = row.get(0);
        Uuid::parse_str(&subject_id)
            .map_err(|error| AppError::Config(format!("invalid session subject id: {error}")))
    })
    .transpose()
}
