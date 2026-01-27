use crate::infrastructure::session_store::PostgresSessionStore;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct RazorpayConfig {
    pub key_id: String,
    pub key_secret: String,
    pub webhook_secret: String,
}

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub session_store: PostgresSessionStore,
    pub razorpay: Arc<RazorpayConfig>,
    pub s3_client: aws_sdk_s3::Client,
    pub s3_bucket: String,
    pub s3_public_url: Option<String>,
    pub max_upload_size: usize,
}

impl AppState {
    pub async fn new_mock(db: PgPool, session_store: PostgresSessionStore) -> Self {
        let razorpay = Arc::new(RazorpayConfig {
            key_id: "test".to_string(),
            key_secret: "test".to_string(),
            webhook_secret: "test".to_string(),
        });

        let s3_config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .region(aws_sdk_s3::config::Region::new("us-east-1"))
            .load()
            .await;
        let s3_client = aws_sdk_s3::Client::new(&s3_config);

        Self {
            db,
            session_store,
            razorpay,
            s3_client,
            s3_bucket: "test-bucket".to_string(),
            s3_public_url: None,
            max_upload_size: 20 * 1024 * 1024,
        }
    }
}
