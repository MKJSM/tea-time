use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub db_pool_size: usize,
    pub server_port: u16,
    pub default_admin_email: String,
    pub default_admin_password: String,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        dotenvy::from_filename("backend/.env").ok();
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL")?;
        let db_pool_size = env::var("DATABASE_POOL_SIZE")
            .ok()
            .and_then(|value| value.parse::<usize>().ok())
            .unwrap_or(5);
        let server_port = env::var("PORT")
            .ok()
            .and_then(|value| value.parse::<u16>().ok())
            .unwrap_or(3001);
        let default_admin_email =
            env::var("DEFAULT_ADMIN_EMAIL").unwrap_or_else(|_| "admin@tea-time.local".to_string());
        let default_admin_password =
            env::var("DEFAULT_ADMIN_PASSWORD").unwrap_or_else(|_| "TeaTimeAdmin123!".to_string());

        Ok(Self {
            database_url,
            db_pool_size,
            server_port,
            default_admin_email,
            default_admin_password,
        })
    }
}
