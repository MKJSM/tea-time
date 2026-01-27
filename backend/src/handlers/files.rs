use crate::auth::RequiredAuthUser;
use crate::error::AppError;
use crate::state::AppState;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::types::ObjectCannedAcl;
use axum::{
    extract::{Multipart, State},
    Json,
};
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize)]
pub struct UploadResponse {
    pub image_url: String,
}

/// Upload an image to S3
/// Requires authentication to prevent abuse
pub async fn upload_image(
    _auth_user: RequiredAuthUser, // Require authentication
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, AppError> {
    let mut image_data = None;
    let mut extension = None;
    let mut content_type = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Failed to parse multipart data: {}", e)))?
    {
        let name = field.name().unwrap_or_default().to_string();

        if name == "file" || name == "image" {
            let ct = field
                .content_type()
                .map(|s| s.to_string())
                .unwrap_or_default();

            // Validate content type
            let ext = match ct.as_str() {
                "image/png" => Some("png"),
                "image/jpeg" | "image/jpg" => Some("jpg"),
                _ => {
                    return Err(AppError::BadRequest(
                        "Unsupported image type. Only PNG, JPG, and JPEG are allowed.".into(),
                    ))
                }
            };

            let data = field
                .bytes()
                .await
                .map_err(|e| AppError::BadRequest(format!("Failed to read file data: {}", e)))?;

            // Validate size
            if data.len() > state.max_upload_size {
                return Err(AppError::BadRequest(format!(
                    "File too large. Maximum size is {}MB.",
                    state.max_upload_size / (1024 * 1024)
                )));
            }

            image_data = Some(data);
            extension = ext;
            content_type = Some(ct);
            break;
        }
    }

    let data = image_data.ok_or_else(|| AppError::BadRequest("No image file provided".into()))?;
    let ext = extension.unwrap();
    let ct = content_type.unwrap();

    // Generate unique key
    let key = format!("uploads/{}.{}", Uuid::new_v4(), ext);

    // Upload to S3
    state
        .s3_client
        .put_object()
        .bucket(&state.s3_bucket)
        .key(&key)
        .body(ByteStream::from(data))
        .content_type(ct)
        .acl(ObjectCannedAcl::PublicRead)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to upload to S3: {:?}", e);
            AppError::InternalServerError("Failed to upload image".into())
        })?;

    // Construct URL
    let image_url = if let Some(public_url) = &state.s3_public_url {
        format!("{}/{}", public_url.trim_end_matches('/'), key)
    } else {
        // Default AWS S3 URL format
        format!("https://{}.s3.amazonaws.com/{}", state.s3_bucket, key)
    };

    Ok(Json(UploadResponse { image_url }))
}
