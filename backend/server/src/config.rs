use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub db_pool_size: usize,
    pub server_port: u16,
    pub default_admin_email: String,
    pub default_admin_password: String,
    pub razorpay_key_id: String,
    pub razorpay_key_secret: String,
    pub razorpay_webhook_secret: String,
    pub s3_bucket: String,
    pub s3_region: String,
    pub s3_endpoint: Option<String>,
    pub s3_public_url: Option<String>,
    pub max_upload_size: usize,
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
        let razorpay_key_id =
            env::var("RAZORPAY_KEY_ID").unwrap_or_else(|_| "rzp_test_placeholder".to_string());
        let razorpay_key_secret =
            env::var("RAZORPAY_KEY_SECRET").unwrap_or_else(|_| "placeholder_secret".to_string());
        let razorpay_webhook_secret = env::var("RAZORPAY_WEBHOOK_SECRET")
            .unwrap_or_else(|_| "placeholder_webhook_secret".to_string());
        let s3_bucket =
            env::var("AWS_S3_BUCKET").unwrap_or_else(|_| "teatime-uploads".to_string());
        let s3_region = env::var("AWS_REGION").unwrap_or_else(|_| "ap-south-1".to_string());
        let s3_endpoint = env::var("AWS_S3_ENDPOINT").ok();
        let s3_public_url = env::var("S3_PUBLIC_URL").ok();
        let max_upload_size = env::var("MAX_UPLOAD_SIZE")
            .ok()
            .and_then(|value| value.parse::<usize>().ok())
            .unwrap_or(20 * 1024 * 1024);

        Ok(Self {
            database_url,
            db_pool_size,
            server_port,
            default_admin_email,
            default_admin_password,
            razorpay_key_id,
            razorpay_key_secret,
            razorpay_webhook_secret,
            s3_bucket,
            s3_region,
            s3_endpoint,
            s3_public_url,
            max_upload_size,
        })
    }
}
