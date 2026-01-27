use std::env;

pub struct Config {
    pub database_url: String,
    pub server_port: u16,
    pub is_production: bool,
    pub allowed_origins: Vec<String>,
    pub razorpay_key_id: String,
    pub razorpay_key_secret: String,
    pub razorpay_webhook_secret: String,
    pub db_max_connections: u32,
    pub run_migrations: bool,
    pub s3_bucket: String,
    pub s3_region: String,
    pub s3_endpoint: Option<String>,
    pub s3_public_url: Option<String>,
    pub max_upload_size: usize,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

        // Ensure the database URL starts with postgres://
        if !(database_url.starts_with("postgres://") || database_url.starts_with("postgresql://")) {
            panic!("DATABASE_URL must start with postgres://");
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

        // Razorpay credentials - required in production
        let razorpay_key_id = if is_production {
            env::var("RAZORPAY_KEY_ID")
                .expect("RAZORPAY_KEY_ID must be set in production environment")
        } else {
            env::var("RAZORPAY_KEY_ID").unwrap_or_else(|_| "rzp_test_placeholder".to_string())
        };

        let razorpay_key_secret = if is_production {
            env::var("RAZORPAY_KEY_SECRET")
                .expect("RAZORPAY_KEY_SECRET must be set in production environment")
        } else {
            env::var("RAZORPAY_KEY_SECRET").unwrap_or_else(|_| "placeholder_secret".to_string())
        };

        let razorpay_webhook_secret = if is_production {
            env::var("RAZORPAY_WEBHOOK_SECRET")
                .expect("RAZORPAY_WEBHOOK_SECRET must be set in production environment")
        } else {
            env::var("RAZORPAY_WEBHOOK_SECRET")
                .unwrap_or_else(|_| "placeholder_webhook_secret".to_string())
        };

        let db_max_connections = env::var("DATABASE_MAX_CONNECTIONS")
            .unwrap_or_else(|_| "50".to_string())
            .parse()
            .expect("DATABASE_MAX_CONNECTIONS must be a number");

        let run_migrations = env::var("RUN_MIGRATIONS")
            .map(|v| v.to_lowercase() == "true")
            .unwrap_or(true);

        let s3_bucket = env::var("AWS_S3_BUCKET").unwrap_or_else(|_| "teatime-uploads".to_string());
        let s3_region = env::var("AWS_REGION").unwrap_or_else(|_| "ap-south-1".to_string());
        let s3_endpoint = env::var("AWS_S3_ENDPOINT").ok();
        let s3_public_url = env::var("S3_PUBLIC_URL").ok();
        let max_upload_size = env::var("MAX_UPLOAD_SIZE")
            .unwrap_or_else(|_| (20 * 1024 * 1024).to_string())
            .parse()
            .expect("MAX_UPLOAD_SIZE must be a number");

        Self {
            database_url,
            server_port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .expect("PORT must be a number"),
            is_production,
            allowed_origins,
            razorpay_key_id,
            razorpay_key_secret,
            razorpay_webhook_secret,
            db_max_connections,
            run_migrations,
            s3_bucket,
            s3_region,
            s3_endpoint,
            s3_public_url,
            max_upload_size,
        }
    }
}
