use crate::infrastructure::session_store::SqliteSessionStore;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub session_store: SqliteSessionStore,
}
