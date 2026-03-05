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

export const eventsApi = createApi({
    reducerPath: 'eventsApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Events'],
    endpoints: (builder) => ({
        createEventBooking: builder.mutation<EventBookingResponse, CreateEventBookingRequest>({
            query: (data) => ({
                url: '/events',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Events'],
        }),
        getEventBookings: builder.query<{ data: any[]; total: number }, void>({
            query: () => ({ url: '/events', method: 'GET' }),
            providesTags: ['Events'],
        }),
    }),
});

export const {
    useCreateEventBookingMutation,
    useGetEventBookingsQuery,
} = eventsApi;
