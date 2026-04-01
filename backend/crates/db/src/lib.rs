use std::{fs, path::Path};

use deadpool_postgres::{Config as PoolConfig, ManagerConfig, Pool, RecyclingMethod, Runtime};
use tokio_postgres::NoTls;

#[derive(Clone, Debug)]
pub struct DatabaseConfig {
    pub database_url: String,
    pub db_pool_size: usize,
}

pub async fn connect(config: &DatabaseConfig) -> Result<Pool, deadpool_postgres::CreatePoolError> {
    let mut pool_config = PoolConfig::new();
    pool_config.url = Some(config.database_url.clone());
    pool_config.manager = Some(ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });
    pool_config.pool = Some(deadpool_postgres::PoolConfig::new(config.db_pool_size));
    pool_config.create_pool(Some(Runtime::Tokio1), NoTls)
}

pub async fn migrate(pool: &Pool) -> Result<(), tokio_postgres::Error> {
    let mut client = pool.get().await.map_err(map_pool_error)?;

    client
        .batch_execute(
            r#"
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            "#,
        )
        .await?;

    let migration_dir = Path::new("backend/db/migration");
    let mut entries = fs::read_dir(migration_dir)
        .unwrap_or_else(|error| panic!("failed to read migration directory: {error}"))
        .collect::<Result<Vec<_>, _>>()
        .unwrap_or_else(|error| panic!("failed to collect migration entries: {error}"));

    entries.sort_by_key(|entry| entry.file_name());

    for entry in entries {
        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("sql") {
            continue;
        }

        let version = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_else(|| panic!("invalid migration filename: {}", path.display()))
            .to_string();

        let already_applied = client
            .query_opt(
                "SELECT version FROM schema_migrations WHERE version = $1",
                &[&version],
            )
            .await?
            .is_some();

        if already_applied {
            continue;
        }

        let sql = fs::read_to_string(&path)
            .unwrap_or_else(|error| panic!("failed to read migration {}: {error}", path.display()));

        let transaction = client.transaction().await?;
        transaction.batch_execute(&sql).await?;
        transaction
            .execute(
                "INSERT INTO schema_migrations (version) VALUES ($1)",
                &[&version],
            )
            .await?;
        transaction.commit().await?;
    }

    Ok(())
}

fn map_pool_error(error: deadpool_postgres::PoolError) -> tokio_postgres::Error {
    match error {
        deadpool_postgres::PoolError::Backend(error) => error,
        other => panic!("database pool error: {other}"),
    }
}
