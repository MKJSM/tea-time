use aws_sdk_s3::{primitives::ByteStream, types::ObjectCannedAcl};
use axum::{extract::{Multipart, State}, routing::post, Json, Router};
use axum_extra::extract::cookie::CookieJar;
use uuid::Uuid;

use backend_session::{cookie_name, lookup_subject_id, SessionScope};
use backend_shared::AppError;

use crate::state::AppState;

#[derive(serde::Serialize)]
struct UploadResponse {
    file_url: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/upload", post(upload))
}

async fn upload(
    State(state): State<AppState>,
    jar: CookieJar,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, AppError> {
    let _user_id = current_user_id(&state, &jar).await?;
    let mut bytes = None;
    let mut content_type = None;
    let mut extension = None;
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|error| AppError::BadRequest(format!("failed to parse multipart data: {error}")))?
    {
        let name = field.name().unwrap_or_default().to_string();
        if name == "file" {
            let ct = field.content_type().unwrap_or("application/octet-stream").to_string();
            let ext = match ct.as_str() {
                "image/png" => "png",
                "image/jpeg" | "image/jpg" => "jpg",
                "image/webp" => "webp",
                "video/mp4" => "mp4",
                _ => return Err(AppError::BadRequest("unsupported file type".into())),
            };
            let data = field.bytes().await.map_err(|error| AppError::BadRequest(format!("failed to read file: {error}")))?;
            if data.len() > state.max_upload_size {
                return Err(AppError::BadRequest("file too large".into()));
            }
            bytes = Some(data);
            content_type = Some(ct);
            extension = Some(ext.to_string());
            break;
        }
    }
    let bytes = bytes.ok_or_else(|| AppError::BadRequest("no file provided".into()))?;
    let extension = extension.unwrap_or_else(|| "bin".into());
    let key = format!("uploads/{}.{}", Uuid::new_v4(), extension);
    state
        .s3_client
        .put_object()
        .bucket(&state.s3_bucket)
        .key(&key)
        .body(ByteStream::from(bytes.to_vec()))
        .content_type(content_type.unwrap_or_else(|| "application/octet-stream".into()))
        .acl(ObjectCannedAcl::PublicRead)
        .send()
        .await
        .map_err(|error| AppError::Config(format!("failed to upload file: {error}")))?;
    let file_url = if let Some(public_url) = &state.s3_public_url {
        format!("{}/{}", public_url.trim_end_matches('/'), key)
    } else {
        format!("https://{}.s3.amazonaws.com/{}", state.s3_bucket, key)
    };
    Ok(Json(UploadResponse { file_url }))
}

async fn current_user_id(state: &AppState, jar: &CookieJar) -> Result<String, AppError> {
    for scope in [SessionScope::Customer, SessionScope::Admin] {
        let Some(token) = jar
            .get(cookie_name(scope))
            .map(|cookie| cookie.value().to_string()) else {
            continue;
        };
        if let Some(user_id) = lookup_subject_id(&state.db, scope, &token).await? {
            return Ok(user_id.to_string());
        }
    }
    Err(AppError::Unauthorized("session is missing or invalid".into()))
}
