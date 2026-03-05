/**
 * MSW (Mock Service Worker) handlers and server used in tests.
 * Import { server } in individual test files and call:
 *   beforeAll(() => server.listen())
 *   afterEach(() => server.resetHandlers())
 *   afterAll(() => server.close())
 */
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// ── Mock data ─────────────────────────────────────────────────────────────────

export const mockProducts = [
    {
        id: 'prod-1',
        name: 'Masala Chai',
        description: 'A rich spicy tea blend',
        base_price: 25.0,
        category: ['Tea', 'Hot'],
        image_urls: ['/tea-masala.jpg'],
        is_active: true,
        stock_quantity: 200,
        rating: 4.5,
        review_count: 120,
        customization_groups: [],
    },
    {
        id: 'prod-2',
        name: 'Green Tea',
        description: 'Light refreshing green tea',
        base_price: 20.0,
        category: ['Tea', 'Hot'],
        image_urls: ['/tea-green.jpg'],
        is_active: true,
        stock_quantity: 150,
        rating: 4.2,
        review_count: 85,
        customization_groups: [],
    },
    {
        id: 'prod-3',
        name: 'Cold Coffee',
        description: 'Chilled coffee with milk',
        base_price: 35.0,
        category: ['Coffee', 'Cold'],
        image_urls: ['/coffee-cold.jpg'],
        is_active: true,
        stock_quantity: 100,
        rating: 4.7,
        review_count: 210,
        customization_groups: [],
    },
];

export const mockEventBookingResponse = {
    id: 'evt-booking-uuid-1234',
    event_name: "Test Wedding",
    event_date: '2026-06-20',
    status: 'pending',
    estimated_total: 3235.0,
    message:
        'Your event booking request has been received! Our team will call you within 30–60 minutes to confirm the details and finalize your booking.',
};

// ── Request handlers ──────────────────────────────────────────────────────────

export const handlers = [
    // Products list (paginated)
    http.get('/api/products', () => {
        return HttpResponse.json({
            data: mockProducts,
            total: mockProducts.length,
            page: 1,
            limit: 12,
            totalPages: 1,
        });
    }),

    // Product by ID
    http.get('/api/products/:id', ({ params }) => {
        const product = mockProducts.find((p) => p.id === params.id);
        if (!product) return new HttpResponse(null, { status: 404 });
        return HttpResponse.json(product);
    }),

    // Create event booking
    http.post('/api/events', () => {
        return HttpResponse.json(mockEventBookingResponse, { status: 201 });
    }),

    // List event bookings (admin)
    http.get('/api/events', () => {
        return HttpResponse.json({
            data: [],
            total: 0,
        });
    }),
];

// ── MSW Node server ───────────────────────────────────────────────────────────

export const server = setupServer(...handlers);
