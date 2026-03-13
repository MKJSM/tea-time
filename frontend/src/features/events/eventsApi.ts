import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/client';

export interface EventSelectedItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
}

export interface CreateEventBookingRequest {
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    event_name: string;
    event_type: string;
    event_date: string; // "YYYY-MM-DD"
    time_slot: string;  // "morning" | "afternoon" | "evening"
    venue_address: string;
    headcount_total: number;
    headcount_adults: number;
    headcount_kids: number;
    headcount_seniors: number;
    selected_items: EventSelectedItem[];
    estimated_base: number;
    estimated_deposit: number;
    estimated_delivery: number;
    estimated_tax: number;
    estimated_total: number;
    notes?: string;
}

export interface EventBookingResponse {
    id: string;
    event_name: string;
    event_date: string;
    status: string;
    estimated_total: number;
    message: string;
}

export interface EventBookingStatusHistory {
    id: string;
    old_status: string | null;
    new_status: string;
    notes: string | null;
    created_at: string | null;
}

export interface EventBookingDetail {
    id: string;
    user_id: string | null;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    event_name: string;
    event_type: string;
    event_date: string;
    time_slot: string;
    venue_address: string;
    headcount_total: number;
    headcount_adults: number;
    headcount_kids: number;
    headcount_seniors: number;
    selected_items: EventSelectedItem[];
    estimated_base: number;
    estimated_deposit: number;
    estimated_delivery: number;
    estimated_tax: number;
    estimated_total: number;
    notes: string | null;
    admin_notes: string | null;
    status: string;
    cancellation_reason: string | null;
    confirmed_at: string | null;
    cancelled_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    status_history: EventBookingStatusHistory[];
}

export interface EventBookingSummary {
    id: string;
    contact_name: string;
    contact_email: string;
    event_name: string;
    event_type: string;
    event_date: string;
    time_slot: string;
    venue_address: string;
    headcount_total: number;
    selected_items: EventSelectedItem[];
    estimated_total: number;
    status: string;
    cancellation_reason: string | null;
    confirmed_at: string | null;
    cancelled_at: string | null;
    created_at: string | null;
}

export interface UpdateEventBookingStatusRequest {
    status: 'confirmed' | 'cancelled';
    notes?: string;
    cancellation_reason?: string;
}

export const eventsApi = createApi({
    reducerPath: 'eventsApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Events', 'MyEvents'],
    endpoints: (builder) => ({
        createEventBooking: builder.mutation<EventBookingResponse, CreateEventBookingRequest>({
            query: (data) => ({
                url: '/events',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Events', 'MyEvents'],
        }),
        getEventBookings: builder.query<{ data: any[]; total: number }, void>({
            query: () => ({ url: '/events', method: 'GET' }),
            providesTags: ['Events'],
        }),
        getMyEventBookings: builder.query<{ data: EventBookingSummary[]; total: number }, void>({
            query: () => ({ url: '/events/my', method: 'GET' }),
            providesTags: ['MyEvents'],
        }),
        getEventBookingById: builder.query<EventBookingDetail, string>({
            query: (id) => ({ url: `/events/${id}`, method: 'GET' }),
            providesTags: (_result, _err, id) => [{ type: 'MyEvents', id }],
        }),
        updateEventBookingStatus: builder.mutation<
            { id: string; old_status: string; status: string; message: string },
            { id: string; body: UpdateEventBookingStatusRequest }
        >({
            query: ({ id, body }) => ({
                url: `/events/${id}/status`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, _err, { id }) => [
                'Events',
                'MyEvents',
                { type: 'MyEvents', id },
            ],
        }),
    }),
});

export const {
    useCreateEventBookingMutation,
    useGetEventBookingsQuery,
    useGetMyEventBookingsQuery,
    useGetEventBookingByIdQuery,
    useUpdateEventBookingStatusMutation,
} = eventsApi;
