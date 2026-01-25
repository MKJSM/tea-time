use std::env;

pub struct Config {
    pub database_url: String,
    pub server_port: u16,
    pub is_production: bool,
    pub allowed_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

        // Ensure the database URL starts with sqlite://
        if !database_url.starts_with("sqlite://") {
            panic!("DATABASE_URL must start with sqlite://");
        }

        let is_production = env::var("ENVIRONMENT")
            .map(|e| e.to_lowercase() == "production")
            .unwrap_or(false);

        // Parse allowed origins from comma-separated list
        let allowed_origins = env::var("ALLOWED_ORIGINS")
            .map(|s| s.split(',').map(|o| o.trim().to_string()).collect())
            .unwrap_or_else(|_| {
                vec![
                    "http://localhost:3000".to_string(),
                    "https://tea-time-production.up.railway.app".to_string(),
                ]
            });

        Self {
            database_url,
            server_port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .expect("PORT must be a number"),
            is_production,
            allowed_origins,
        }
    }
}
