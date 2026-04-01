use deadpool_postgres::PoolError;

use crate::libs::error::AppError;

pub fn map_pool_error_to_app_error(error: PoolError) -> AppError {
    match error {
        PoolError::Backend(error) => AppError::Database(error),
        other => AppError::Config(format!("database pool error: {other}")),
    }
}
