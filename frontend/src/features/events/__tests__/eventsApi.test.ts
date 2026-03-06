/**
 * RTK Query mutation tests for eventsApi.createEventBooking
 * Uses MSW to intercept /api/events and verify the slice wires up correctly.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from '../../../features/products/productsApi';
import { favoritesApi } from '../../../features/favorites/favoritesApi';
import authReducer from '../../../features/auth/authSlice';
import cartReducer from '../../../features/cart/cartSlice';
import { eventsApi, CreateEventBookingRequest } from '../eventsApi';
import { server, mockEventBookingResponse } from '../../../test/server';
import { http, HttpResponse } from 'msw';

function makeStore() {
    return configureStore({
        reducer: {
            [eventsApi.reducerPath]: eventsApi.reducer,
            [productsApi.reducerPath]: productsApi.reducer,
            [favoritesApi.reducerPath]: favoritesApi.reducer,
            auth: authReducer,
            cart: cartReducer,
        },
        middleware: (g) => g({ serializableCheck: false }).concat(eventsApi.middleware, productsApi.middleware, favoritesApi.middleware),
    });
}

const validPayload: CreateEventBookingRequest = {
    contact_name: 'Arjun Test',
    contact_phone: '9876543210',
    contact_email: 'arjun@test.com',
    event_name: 'Test Wedding',
    event_type: 'wedding',
    event_date: '2026-06-20',
    time_slot: 'evening',
    venue_address: '123 Test Street, Chennai',
    headcount_total: 100,
    headcount_adults: 80,
    headcount_kids: 10,
    headcount_seniors: 10,
    selected_items: [
        { product_id: 'prod-1', product_name: 'Masala Chai', quantity: 100, unit_price: 25.0 },
    ],
    estimated_base: 2500.0,
    estimated_deposit: 400.0,
    estimated_delivery: 200.0,
    estimated_tax: 135.0,
    estimated_total: 3235.0,
};

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('eventsApi — createEventBooking mutation', () => {
    it('successfully dispatches and receives a response from /api/events', async () => {
        const store = makeStore();
        const result = await store.dispatch(
            eventsApi.endpoints.createEventBooking.initiate(validPayload)
        );

        expect(result.data).toBeDefined();
        expect(result.data?.status).toBe('pending');
        expect(result.data?.event_name).toBe(mockEventBookingResponse.event_name);
        expect(result.data?.id).toBe(mockEventBookingResponse.id);
    });

    it('response contains the callback message', async () => {
        const store = makeStore();
        const result = await store.dispatch(
            eventsApi.endpoints.createEventBooking.initiate(validPayload)
        );

        expect(result.data?.message).toContain('30–60 minutes');
    });

    it('mutation reflects error state on server failure', async () => {
        // Override handler to return 500
        server.use(
            http.post('http://localhost/api/events', () => {
                return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
            })
        );

        const store = makeStore();
        const result = await store.dispatch(
            eventsApi.endpoints.createEventBooking.initiate(validPayload)
        );

        expect(result.error).toBeDefined();
    });

    it('estimated_total matches what was sent', async () => {
        const store = makeStore();
        const result = await store.dispatch(
            eventsApi.endpoints.createEventBooking.initiate(validPayload)
        );
        // Mock returns 3235.0 as the estimated total
        expect(result.data?.estimated_total).toBe(3235.0);
    });
});

describe('eventsApi — getEventBookings query', () => {
    it('fetches the events list', async () => {
        const store = makeStore();
        const result = await store.dispatch(
            eventsApi.endpoints.getEventBookings.initiate()
        );
        expect(result.data).toBeDefined();
        expect(result.data?.total).toBe(0);
        expect(Array.isArray(result.data?.data)).toBe(true);
    });
});
