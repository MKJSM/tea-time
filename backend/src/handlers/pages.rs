use axum::response::{Html, IntoResponse};
use sailfish::TemplateOnce;

#[derive(TemplateOnce)]
#[template(path = "index.stpl")]
pub struct IndexTemplate;

pub async fn index_handler() -> impl IntoResponse {
    let ctx = IndexTemplate;
    match ctx.render_once() {
        Ok(html) => Html(html),
        Err(err) => {
            eprintln!("Template rendering error: {}", err);
            Html("Internal Server Error".to_string())
        }
    }
}
