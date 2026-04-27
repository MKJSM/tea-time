use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

use backend_shared::{map_pool_error_to_app_error, AppError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    pub id: String,
    pub user_id: String,
    pub full_name: String,
    pub phone: String,
    pub line_1: String,
    pub line_2: Option<String>,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub country: String,
    pub landmark: Option<String>,
    pub is_default: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AddressInput {
    pub full_name: String,
    pub phone: String,
    pub line_1: String,
    pub line_2: Option<String>,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub country: Option<String>,
    pub landmark: Option<String>,
    pub is_default: bool,
}

pub async fn list_for_user(pool: &Pool, user_id: &str) -> Result<serde_json::Value, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let rows = client.query(
        "SELECT id::text, user_id::text, full_name, phone, line_1, line_2, city, state, postal_code, country, landmark, is_default
         FROM address WHERE user_id = $1::text::uuid ORDER BY is_default DESC, created_on DESC",
        &[&user_id],
    ).await?;
    Ok(serde_json::json!({"ok": true, "items": rows.iter().map(map_address).collect::<Vec<_>>()}))
}

pub async fn create_for_user(
    pool: &Pool,
    user_id: &str,
    input: AddressInput,
) -> Result<Address, AppError> {
    validate(&input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    if input.is_default {
        client
            .execute(
                "UPDATE address SET is_default = FALSE WHERE user_id = $1::text::uuid",
                &[&user_id],
            )
            .await?;
    }
    let id = Uuid::new_v4().to_string();
    client.execute(
        "INSERT INTO address
         (id, user_id, full_name, phone, line_1, line_2, city, state, postal_code, country, landmark, is_default)
         VALUES ($1::text::uuid, $2::text::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
        &[&id, &user_id, &input.full_name, &input.phone, &input.line_1, &input.line_2, &input.city,
          &input.state, &input.postal_code, &input.country.clone().unwrap_or_else(|| "India".into()),
          &input.landmark, &input.is_default]
    ).await?;
    get_for_user(pool, user_id, &id).await
}

pub async fn update_for_user(
    pool: &Pool,
    user_id: &str,
    address_id: &str,
    input: AddressInput,
) -> Result<Address, AppError> {
    validate(&input)?;
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    if input.is_default {
        client
            .execute(
                "UPDATE address SET is_default = FALSE WHERE user_id = $1::text::uuid",
                &[&user_id],
            )
            .await?;
    }
    let updated = client.execute(
        "UPDATE address SET full_name = $3, phone = $4, line_1 = $5, line_2 = $6, city = $7, state = $8,
         postal_code = $9, country = $10, landmark = $11, is_default = $12, modified_on = NOW()
         WHERE id = $1::text::uuid AND user_id = $2::text::uuid",
        &[&address_id, &user_id, &input.full_name, &input.phone, &input.line_1, &input.line_2, &input.city,
          &input.state, &input.postal_code, &input.country.clone().unwrap_or_else(|| "India".into()),
          &input.landmark, &input.is_default]
    ).await?;
    if updated == 0 {
        return Err(AppError::NotFound("address not found".into()));
    }
    get_for_user(pool, user_id, address_id).await
}

pub async fn delete_for_user(pool: &Pool, user_id: &str, address_id: &str) -> Result<(), AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let deleted = client
        .execute(
            "DELETE FROM address WHERE id = $1::text::uuid AND user_id = $2::text::uuid",
            &[&address_id, &user_id],
        )
        .await?;
    if deleted == 0 {
        return Err(AppError::NotFound("address not found".into()));
    }
    client
        .execute(
            "UPDATE address SET is_default = TRUE WHERE id = (
            SELECT id FROM address WHERE user_id = $1::text::uuid ORDER BY created_on DESC LIMIT 1
        )",
            &[&user_id],
        )
        .await?;
    Ok(())
}

pub async fn get_default_for_user(pool: &Pool, user_id: &str) -> Result<Address, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_opt(
        "SELECT id::text, user_id::text, full_name, phone, line_1, line_2, city, state, postal_code, country, landmark, is_default
         FROM address WHERE user_id = $1::text::uuid ORDER BY is_default DESC, created_on DESC LIMIT 1",
        &[&user_id]
    ).await?;
    row.map(|row| map_address(&row))
        .ok_or_else(|| AppError::BadRequest("address is required".into()))
}

pub async fn get_for_user(
    pool: &Pool,
    user_id: &str,
    address_id: &str,
) -> Result<Address, AppError> {
    let client = pool.get().await.map_err(map_pool_error_to_app_error)?;
    let row = client.query_opt(
        "SELECT id::text, user_id::text, full_name, phone, line_1, line_2, city, state, postal_code, country, landmark, is_default
         FROM address WHERE id = $1::text::uuid AND user_id = $2::text::uuid",
        &[&address_id, &user_id]
    ).await?;
    row.map(|row| map_address(&row))
        .ok_or_else(|| AppError::NotFound("address not found".into()))
}

fn map_address(row: &Row) -> Address {
    Address {
        id: row.get(0),
        user_id: row.get(1),
        full_name: row.get(2),
        phone: row.get(3),
        line_1: row.get(4),
        line_2: row.get(5),
        city: row.get(6),
        state: row.get(7),
        postal_code: row.get(8),
        country: row.get(9),
        landmark: row.get(10),
        is_default: row.get(11),
    }
}

fn validate(input: &AddressInput) -> Result<(), AppError> {
    if input.full_name.trim().is_empty()
        || input.phone.trim().is_empty()
        || input.line_1.trim().is_empty()
        || input.city.trim().is_empty()
        || input.state.trim().is_empty()
        || input.postal_code.trim().is_empty()
    {
        return Err(AppError::BadRequest(
            "full_name, phone, line_1, city, state, and postal_code are required".into(),
        ));
    }
    Ok(())
}
