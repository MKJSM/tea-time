use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::{AuthSession, RequiredAuthUser},
    domain::models::{
        CreateEventBookingRequest, EditEventBookingRequest, EventBookingResponse,
        UpdateEventBookingStatusRequest,
    },
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
    body.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    let event_date = chrono::NaiveDate::parse_from_str(&body.event_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid event_date format. Use YYYY-MM-DD".into()))?;

    let user_id = auth.user.as_ref().map(|u| u.id);

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
    .bind(event_date)
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
/// Lists all event bookings. Requires authentication (admin/shop-owner view).
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
            notes, admin_notes, status,
            cancellation_reason, confirmed_at, cancelled_at,
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
                "admin_notes": r.admin_notes,
                "status": r.status,
                "cancellation_reason": r.cancellation_reason,
                "confirmed_at": r.confirmed_at,
                "cancelled_at": r.cancelled_at,
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

/// GET /api/events/my
/// Lists the current authenticated user's event bookings.
#[tracing::instrument(skip(state, user))]
pub async fn list_my_event_bookings(
    State(state): State<AppState>,
    user: RequiredAuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query!(
        r#"
        SELECT
            id,
            contact_name, contact_email,
            event_name, event_type, event_date::text AS event_date, time_slot, venue_address,
            headcount_total,
            selected_items,
            estimated_total,
            status,
            cancellation_reason, confirmed_at, cancelled_at,
            created_at
        FROM event_bookings
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
        user.0.id
    )
    .fetch_all(&state.db)
    .await?;

    let bookings: Vec<serde_json::Value> = rows
        .iter()
        .map(|r| {
            serde_json::json!({
                "id": r.id,
                "contact_name": r.contact_name,
                "contact_email": r.contact_email,
                "event_name": r.event_name,
                "event_type": r.event_type,
                "event_date": r.event_date,
                "time_slot": r.time_slot,
                "venue_address": r.venue_address,
                "headcount_total": r.headcount_total,
                "selected_items": r.selected_items,
                "estimated_total": r.estimated_total,
                "status": r.status,
                "cancellation_reason": r.cancellation_reason,
                "confirmed_at": r.confirmed_at,
                "cancelled_at": r.cancelled_at,
                "created_at": r.created_at,
            })
        })
        .collect();

    let total = bookings.len();
    Ok(Json(serde_json::json!({
        "data": bookings,
        "total": total
    })))
}

/// GET /api/events/:id
/// Gets a single event booking with full detail + status history.
/// Authenticated users can only fetch their own bookings.
#[tracing::instrument(skip(state, auth))]
pub async fn get_event_booking(
    State(state): State<AppState>,
    auth: AuthSession,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = auth.user.as_ref().map(|u| u.id);

    let row = sqlx::query!(
        r#"
        SELECT
            id, user_id,
            contact_name, contact_phone, contact_email,
            event_name, event_type, event_date::text AS event_date, time_slot, venue_address,
            headcount_total, headcount_adults, headcount_kids, headcount_seniors,
            selected_items,
            estimated_base, estimated_deposit, estimated_delivery, estimated_tax, estimated_total,
            notes, admin_notes, status,
            cancellation_reason, confirmed_at, cancelled_at,
            created_at, updated_at
        FROM event_bookings
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Event booking not found".into()))?;

    // If a logged-in user, only allow access to their own booking
    if let Some(uid) = user_id {
        if let Some(booking_user) = row.user_id {
            if booking_user != uid {
                return Err(AppError::Forbidden("Access denied".into()));
            }
        }
    }

    // Fetch status history
    let history_rows = sqlx::query!(
        r#"
        SELECT id, old_status, new_status, notes, created_at
        FROM event_booking_status_history
        WHERE booking_id = $1
        ORDER BY created_at ASC
        "#,
        id
    )
    .fetch_all(&state.db)
    .await?;

    let status_history: Vec<serde_json::Value> = history_rows
        .iter()
        .map(|h| {
            serde_json::json!({
                "id": h.id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "notes": h.notes,
                "created_at": h.created_at,
            })
        })
        .collect();

    Ok(Json(serde_json::json!({
        "id": row.id,
        "user_id": row.user_id,
        "contact_name": row.contact_name,
        "contact_phone": row.contact_phone,
        "contact_email": row.contact_email,
        "event_name": row.event_name,
        "event_type": row.event_type,
        "event_date": row.event_date,
        "time_slot": row.time_slot,
        "venue_address": row.venue_address,
        "headcount_total": row.headcount_total,
        "headcount_adults": row.headcount_adults,
        "headcount_kids": row.headcount_kids,
        "headcount_seniors": row.headcount_seniors,
        "selected_items": row.selected_items,
        "estimated_base": row.estimated_base,
        "estimated_deposit": row.estimated_deposit,
        "estimated_delivery": row.estimated_delivery,
        "estimated_tax": row.estimated_tax,
        "estimated_total": row.estimated_total,
        "notes": row.notes,
        "admin_notes": row.admin_notes,
        "status": row.status,
        "cancellation_reason": row.cancellation_reason,
        "confirmed_at": row.confirmed_at,
        "cancelled_at": row.cancelled_at,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "status_history": status_history,
    })))
}

/// PATCH /api/events/:id/status
/// Updates event booking status. Requires authentication (shop owner action).
/// confirmed → booking locked in, products reserved for event
/// cancelled → booking dismissed, customer notified
#[tracing::instrument(skip(state, user, body))]
pub async fn update_event_booking_status(
    State(state): State<AppState>,
    user: RequiredAuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateEventBookingStatusRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    body.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    let valid_statuses = ["confirmed", "cancelled"];
    if !valid_statuses.contains(&body.status.as_str()) {
        return Err(AppError::BadRequest(
            "Status must be 'confirmed' or 'cancelled'".into(),
        ));
    }

    // Fetch current booking status
    let current = sqlx::query!(
        "SELECT id, status FROM event_bookings WHERE id = $1",
        id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Event booking not found".into()))?;

    let old_status = current.status.clone();

    if old_status == body.status {
        return Err(AppError::BadRequest(format!(
            "Booking is already {}",
            body.status
        )));
    }

    // Only pending bookings can be confirmed or cancelled
    if old_status != "pending" {
        return Err(AppError::BadRequest(format!(
            "Cannot update status from '{}'",
            old_status
        )));
    }

    let mut tx = state.db.begin().await?;

    match body.status.as_str() {
        "confirmed" => {
            sqlx::query!(
                r#"
                UPDATE event_bookings
                SET status = 'confirmed',
                    confirmed_at = NOW(),
                    admin_notes = COALESCE($1, admin_notes),
                    updated_at = NOW()
                WHERE id = $2
                "#,
                body.notes,
                id
            )
            .execute(&mut *tx)
            .await?;
        }
        "cancelled" => {
            sqlx::query!(
                r#"
                UPDATE event_bookings
                SET status = 'cancelled',
                    cancelled_at = NOW(),
                    cancellation_reason = COALESCE($1, cancellation_reason),
                    admin_notes = COALESCE($2, admin_notes),
                    updated_at = NOW()
                WHERE id = $3
                "#,
                body.cancellation_reason,
                body.notes,
                id
            )
            .execute(&mut *tx)
            .await?;
        }
        _ => {}
    }

    // Write status history entry
    sqlx::query!(
        r#"
        INSERT INTO event_booking_status_history
            (booking_id, old_status, new_status, changed_by, notes)
        VALUES ($1, $2, $3, $4, $5)
        "#,
        id,
        old_status,
        body.status,
        user.0.id,
        body.notes
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(serde_json::json!({
        "id": id,
        "old_status": old_status,
        "status": body.status,
        "message": format!("Event booking has been {}.", body.status),
    })))
}

/// PUT /api/events/:id
/// Customer edits their own pending event booking.
/// Only allowed while status = 'pending'.
#[tracing::instrument(skip(state, user, body))]
pub async fn edit_event_booking(
    State(state): State<AppState>,
    user: RequiredAuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<EditEventBookingRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    body.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Fetch booking and verify ownership + status
    let current = sqlx::query!(
        "SELECT id, user_id, status FROM event_bookings WHERE id = $1",
        id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Event booking not found".into()))?;

    // Must be the owner
    if current.user_id != Some(user.0.id) {
        return Err(AppError::Forbidden("You can only edit your own bookings".into()));
    }

    // Can only edit pending bookings
    if current.status != "pending" {
        return Err(AppError::BadRequest(
            "Only pending bookings can be edited".into(),
        ));
    }

    // Parse event_date if provided — validate format, pass as text (cast to date in SQL)
    let event_date_str: Option<String> = if let Some(ref d) = body.event_date {
        chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d")
            .map_err(|_| AppError::BadRequest("Invalid event_date format. Use YYYY-MM-DD".into()))?;
        Some(d.clone())
    } else {
        None
    };

    let selected_items_json = if let Some(ref items) = body.selected_items {
        Some(
            serde_json::to_value(items)
                .map_err(|e| AppError::InternalServerError(e.to_string()))?,
        )
    } else {
        None
    };

    // Use sqlx::query (non-macro) to avoid chrono/time::Date type mismatch
    sqlx::query(
        r#"
        UPDATE event_bookings SET
            event_date        = COALESCE($1::date, event_date),
            time_slot         = COALESCE($2, time_slot),
            venue_address     = COALESCE($3, venue_address),
            headcount_total   = COALESCE($4, headcount_total),
            headcount_adults  = COALESCE($5, headcount_adults),
            headcount_kids    = COALESCE($6, headcount_kids),
            selected_items    = COALESCE($7, selected_items),
            estimated_base    = COALESCE($8, estimated_base),
            estimated_deposit = COALESCE($9, estimated_deposit),
            estimated_delivery= COALESCE($10, estimated_delivery),
            estimated_tax     = COALESCE($11, estimated_tax),
            estimated_total   = COALESCE($12, estimated_total),
            notes             = COALESCE($13, notes),
            updated_at        = NOW()
        WHERE id = $14
        "#,
    )
    .bind(event_date_str)
    .bind(body.time_slot)
    .bind(body.venue_address)
    .bind(body.headcount_total)
    .bind(body.headcount_adults)
    .bind(body.headcount_kids)
    .bind(selected_items_json)
    .bind(body.estimated_base)
    .bind(body.estimated_deposit)
    .bind(body.estimated_delivery)
    .bind(body.estimated_tax)
    .bind(body.estimated_total)
    .bind(body.notes)
    .bind(id)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "id": id,
        "message": "Booking updated successfully.",
    })))
}
