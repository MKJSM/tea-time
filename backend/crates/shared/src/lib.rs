use std::fmt;

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use deadpool_postgres::PoolError;
use tokio_postgres::error::SqlState;

#[derive(Debug)]
pub enum AppError {
    Config(String),
    BadRequest(String),
    Unauthorized(String),
    Conflict(String),
    NotFound(String),
    Database(tokio_postgres::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Config(message) => {
                (StatusCode::INTERNAL_SERVER_ERROR, message).into_response()
            }
            AppError::BadRequest(message) => (StatusCode::BAD_REQUEST, message).into_response(),
            AppError::Unauthorized(message) => (StatusCode::UNAUTHORIZED, message).into_response(),
            AppError::Conflict(message) => (StatusCode::CONFLICT, message).into_response(),
            AppError::NotFound(message) => (StatusCode::NOT_FOUND, message).into_response(),
            AppError::Database(error) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("database error: {error}"),
            )
                .into_response(),
        }
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Config(message)
            | AppError::BadRequest(message)
            | AppError::Unauthorized(message)
            | AppError::Conflict(message)
            | AppError::NotFound(message) => f.write_str(message),
            AppError::Database(error) => write!(f, "database error: {error}"),
        }
    }
}

impl std::error::Error for AppError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            AppError::Database(error) => Some(error),
            _ => None,
        }
    }
}

impl From<tokio_postgres::Error> for AppError {
    fn from(value: tokio_postgres::Error) -> Self {
        Self::Database(value)
    }
}

pub fn map_pool_error_to_app_error(error: PoolError) -> AppError {
    match error {
        PoolError::Backend(error) => AppError::Database(error),
        other => AppError::Config(format!("database pool error: {other}")),
    }
}

pub fn is_unique_violation(error: &tokio_postgres::Error) -> bool {
    error.code() == Some(&SqlState::UNIQUE_VIOLATION)
}

pub fn ok(scope: &str) -> serde_json::Value {
    serde_json::json!({
        "ok": true,
        "scope": scope,
    })
}
