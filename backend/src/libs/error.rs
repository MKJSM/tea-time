use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

pub enum AppError {
    Config(String),
    Database(tokio_postgres::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Config(message) => {
                (StatusCode::INTERNAL_SERVER_ERROR, message).into_response()
            }
            AppError::Database(error) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("database error: {error}"),
            )
                .into_response(),
        }
    }
}

impl From<tokio_postgres::Error> for AppError {
    fn from(value: tokio_postgres::Error) -> Self {
        Self::Database(value)
    }
}
