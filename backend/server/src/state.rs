use deadpool_postgres::Pool;

#[derive(Clone)]
pub struct AppState {
    pub db: Pool,
    pub http_client: reqwest::Client,
    pub razorpay: RazorpayConfig,
    pub s3_client: aws_sdk_s3::Client,
    pub s3_bucket: String,
    pub s3_public_url: Option<String>,
    pub max_upload_size: usize,
}

#[derive(Clone)]
pub struct RazorpayConfig {
    pub key_id: String,
    pub key_secret: String,
    pub webhook_secret: String,
}
