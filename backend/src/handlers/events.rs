use axum::{extract::State, http::StatusCode, Json};
use validator::Validate;

use crate::{
    auth::{AuthSession, RequiredAuthUser},
    domain::models::{CreateEventBookingRequest, EventBookingResponse},
    error::AppError,
    state::AppState,
};

/// POST /api/events
/// Creates a new event booking / catering enquiry.
/// Works for both authenticated and guest users.
#[tracing::instrument(skip(state, auth, body))]
pub async fn create_event_booking(
    State(state): State<AppState>,
    auth: AuthSession,
    Json(body): Json<CreateEventBookingRequest>,
) -> Result<(StatusCode, Json<EventBookingResponse>), AppError> {
    // Validate request
    body.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Parse event_date
    let event_date = chrono::NaiveDate::parse_from_str(&body.event_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid event_date format. Use YYYY-MM-DD".into()))?;

    // User ID is optional — guest bookings are allowed
    let user_id = auth.user.as_ref().map(|u| u.id);

    // Serialize selected_items to JSON
    let selected_items_json = serde_json::to_value(&body.selected_items)
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    let booking = sqlx::query(
        r#"
        INSERT INTO event_bookings (
            user_id,
            contact_name, contact_phone, contact_email,
            event_name, event_type, event_date, time_slot, venue_address,
            headcount_total, headcount_adults, headcount_kids, headcount_seniors,
            selected_items,
            estimated_base, estimated_deposit, estimated_delivery, estimated_tax, estimated_total,
            notes,
            status
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14,
            $15, $16, $17, $18, $19,
            $20,
            'pending'
        )
        RETURNING id, event_name, event_date, status, estimated_total
        "#,
    )
    .bind(user_id)
    .bind(&body.contact_name)
    .bind(&body.contact_phone)
    .bind(&body.contact_email)
    .bind(&body.event_name)
    .bind(&body.event_type)
    .bind(event_date) // This works with sqlx::query for chrono::NaiveDate
    .bind(&body.time_slot)
    .bind(&body.venue_address)
    .bind(body.headcount_total)
    .bind(body.headcount_adults)
    .bind(body.headcount_kids)
    .bind(body.headcount_seniors)
    .bind(selected_items_json)
    .bind(body.estimated_base)
    .bind(body.estimated_deposit)
    .bind(body.estimated_delivery)
    .bind(body.estimated_tax)
    .bind(body.estimated_total)
    .bind(&body.notes)
    .fetch_one(&state.db)
    .await?;

    use sqlx::Row;
    let response = EventBookingResponse {
        id: booking.get("id"),
        event_name: booking.get("event_name"),
        event_date: booking.get::<chrono::NaiveDate, _>("event_date").to_string(),
        status: booking.get("status"),
        estimated_total: booking.get("estimated_total"),
        message: "Your event booking request has been received! Our team will call you within 30–60 minutes to confirm the details and finalize your booking.".into(),
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// GET /api/events
/// Lists all event bookings. Requires authentication.
#[tracing::instrument(skip(state, _user))]
pub async fn list_event_bookings(
    State(state): State<AppState>,
    _user: RequiredAuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query!(
        r#"
        SELECT
            id, user_id,
            contact_name, contact_phone, contact_email,
            event_name, event_type, event_date::text AS event_date, time_slot, venue_address,
            headcount_total, headcount_adults, headcount_kids, headcount_seniors,
            selected_items,
            estimated_base, estimated_deposit, estimated_delivery, estimated_tax, estimated_total,
            notes, status,
            created_at, updated_at
        FROM event_bookings
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    let bookings: Vec<serde_json::Value> = rows
        .iter()
        .map(|r| {
            serde_json::json!({
                "id": r.id,
                "user_id": r.user_id,
                "contact_name": r.contact_name,
                "contact_phone": r.contact_phone,
                "contact_email": r.contact_email,
                "event_name": r.event_name,
                "event_type": r.event_type,
                "event_date": r.event_date,
                "time_slot": r.time_slot,
                "venue_address": r.venue_address,
                "headcount_total": r.headcount_total,
                "headcount_adults": r.headcount_adults,
                "headcount_kids": r.headcount_kids,
                "headcount_seniors": r.headcount_seniors,
                "selected_items": r.selected_items,
                "estimated_base": r.estimated_base,
                "estimated_deposit": r.estimated_deposit,
                "estimated_delivery": r.estimated_delivery,
                "estimated_tax": r.estimated_tax,
                "estimated_total": r.estimated_total,
                "notes": r.notes,
                "status": r.status,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            })
        })
        .collect();

    let total = bookings.len();
    Ok(Json(serde_json::json!({
        "data": bookings,
        "total": total
    })))
}
