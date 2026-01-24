use std::env;

pub struct Config {
    pub database_url: String,
    pub server_port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        
        // Ensure the database URL starts with sqlite://
        if !database_url.starts_with("sqlite://") {
            panic!("DATABASE_URL must start with sqlite://");
        }

        Self {
            database_url,
            server_port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .expect("PORT must be a number"),
        }
    }
}