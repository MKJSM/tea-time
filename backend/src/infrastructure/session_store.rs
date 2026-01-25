use axum::async_trait;
use sqlx::SqlitePool;
use time::OffsetDateTime;
use tower_sessions::{
    session::{Id, Record},
    ExpiredDeletion, SessionStore,
};

#[derive(Clone, Debug)]
pub struct SqliteSessionStore {
    pool: SqlitePool,
    table_name: String,
}

impl SqliteSessionStore {
    /// Create a new session store. Call `migrate()` after to ensure table exists.
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool,
            table_name: "sessions".to_string(),
        }
    }

    /// Create the sessions table if it doesn't exist.
    /// Call this during app startup to ensure the table is ready.
    pub async fn migrate(&self) -> sqlx::Result<()> {
        let query = format!(
            r#"
            CREATE TABLE IF NOT EXISTS {table} (
                id TEXT PRIMARY KEY NOT NULL,
                data BLOB NOT NULL,
                expiry_date INTEGER NOT NULL,
                user_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            "#,
            table = self.table_name
        );
        sqlx::query(&query).execute(&self.pool).await?;

        // Create indexes for performance
        let idx_user = format!(
            "CREATE INDEX IF NOT EXISTS idx_{table}_user_id ON {table}(user_id)",
            table = self.table_name
        );
        let idx_expiry = format!(
            "CREATE INDEX IF NOT EXISTS idx_{table}_expiry ON {table}(expiry_date)",
            table = self.table_name
        );
        sqlx::query(&idx_user).execute(&self.pool).await?;
        sqlx::query(&idx_expiry).execute(&self.pool).await?;

        tracing::info!("Session store table '{}' ready", self.table_name);
        Ok(())
    }

    pub async fn delete_by_user(&self, user_id: &str) -> sqlx::Result<()> {
        let query = format!("DELETE FROM {} WHERE user_id = ?", self.table_name);
        sqlx::query(&query)
            .bind(user_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Delete specific session only if it belongs to the specified user (prevents session hijacking)
    pub async fn delete_session_for_user(
        &self,
        session_id: &str,
        user_id: &str,
    ) -> sqlx::Result<u64> {
        let query = format!(
            "DELETE FROM {} WHERE id = ? AND user_id = ?",
            self.table_name
        );
        let result = sqlx::query(&query)
            .bind(session_id)
            .bind(user_id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }
}

#[async_trait]
impl ExpiredDeletion for SqliteSessionStore {
    async fn delete_expired(&self) -> tower_sessions::session_store::Result<()> {
        let query = format!("DELETE FROM {} WHERE expiry_date < ?", self.table_name);
        sqlx::query(&query)
            .bind(OffsetDateTime::now_utc().unix_timestamp())
            .execute(&self.pool)
            .await
            .map_err(|e| tower_sessions::session_store::Error::Backend(e.to_string()))?;
        Ok(())
    }
}

#[async_trait]
impl SessionStore for SqliteSessionStore {
    async fn save(&self, record: &Record) -> tower_sessions::session_store::Result<()> {
        tracing::debug!("Saving session: {}", record.id);
        // Extract User ID, IP, UA from session data if present
        let mut user_id: Option<String> = None;
        let mut ip_address: Option<String> = None;
        let mut user_agent: Option<String> = None;

        // SESSION_USER_KEY is "auth-session-user", and it stores an AuthUser struct.
        // serde_json::Value will represent this struct as an Object.
        if let Some(user_val) = record.data.get("auth-session-user") {
            if let Some(id_val) = user_val.get("id") {
                // id in AuthUser is String (UUID)
                if let Some(s) = id_val.as_str() {
                    user_id = Some(s.to_string());
                }
            }
        }

        if let Some(ip_val) = record.data.get("ip_address") {
            if let Some(s) = ip_val.as_str() {
                ip_address = Some(s.to_string());
            }
        }

        if let Some(ua_val) = record.data.get("user_agent") {
            if let Some(s) = ua_val.as_str() {
                user_agent = Some(s.to_string());
            }
        }

        let data = serde_json::to_vec(&record).map_err(|e| {
            tracing::error!("Failed to encode session record: {}", e);
            tower_sessions::session_store::Error::Encode(e.to_string())
        })?;

        let query = format!(
            r#"
            INSERT INTO {table} (id, data, expiry_date, user_id, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                data = excluded.data,
                expiry_date = excluded.expiry_date,
                user_id = excluded.user_id,
                ip_address = excluded.ip_address,
                user_agent = excluded.user_agent
            "#,
            table = self.table_name
        );

        if let Err(e) = sqlx::query(&query)
            .bind(record.id.to_string())
            .bind(data)
            .bind(record.expiry_date.unix_timestamp())
            .bind(user_id)
            .bind(ip_address)
            .bind(user_agent)
            .execute(&self.pool)
            .await
        {
            tracing::error!("Failed to save session to DB: {}", e);
            return Err(tower_sessions::session_store::Error::Backend(e.to_string()));
        }

        Ok(())
    }

    async fn load(&self, session_id: &Id) -> tower_sessions::session_store::Result<Option<Record>> {
        tracing::debug!("Loading session: {}", session_id);
        let query = format!(
            "SELECT data FROM {} WHERE id = ? AND expiry_date > ?",
            self.table_name
        );

        let row: Option<(Vec<u8>,)> = sqlx::query_as(&query)
            .bind(session_id.to_string())
            .bind(OffsetDateTime::now_utc().unix_timestamp())
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to load session from DB: {}", e);
                tower_sessions::session_store::Error::Backend(e.to_string())
            })?;

        if let Some((data,)) = row {
            let record: Record = serde_json::from_slice(&data).map_err(|e| {
                tracing::error!("Failed to decode session record: {}", e);
                tower_sessions::session_store::Error::Decode(e.to_string())
            })?;
            return Ok(Some(record));
        }

        Ok(None)
    }

    async fn delete(&self, session_id: &Id) -> tower_sessions::session_store::Result<()> {
        let query = format!("DELETE FROM {} WHERE id = ?", self.table_name);
        sqlx::query(&query)
            .bind(session_id.to_string())
            .execute(&self.pool)
            .await
            .map_err(|e| tower_sessions::session_store::Error::Backend(e.to_string()))?;
        Ok(())
    }
}
