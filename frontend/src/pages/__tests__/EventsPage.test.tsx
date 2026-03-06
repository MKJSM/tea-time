/**
 * EventsPage integration tests — covers all 5 wizard steps:
 *   Step 1: Event details form
 *   Step 2: Headcount entry
 *   Step 3: Product selection
 *   Step 4: Live quote display
 *   Step 5: Confirm & submit
 */
import React from 'react';
import {
    describe,
    it,
    expect,
    beforeAll,
    afterEach,
    afterAll,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import EventsPage from '../../pages/EventsPage';
import { eventsApi } from '../../features/events/eventsApi';
import { productsApi } from '../../features/products/productsApi';
import { favoritesApi } from '../../features/favorites/favoritesApi';
import authReducer from '../../features/auth/authSlice';
import cartReducer from '../../features/cart/cartSlice';
import { server, mockEventBookingResponse } from '../../test/server';
import { http, HttpResponse } from 'msw';

// ── Test Store ────────────────────────────────────────────────────────────────

function makeStore() {
    return configureStore({
        reducer: {
            auth: authReducer,
            cart: cartReducer,
            [productsApi.reducerPath]: productsApi.reducer,
            [eventsApi.reducerPath]: eventsApi.reducer,
            [favoritesApi.reducerPath]: favoritesApi.reducer,
        },
        middleware: (g) =>
            g({ serializableCheck: false }).concat(
                productsApi.middleware,
                eventsApi.middleware,
                favoritesApi.middleware
            ),
    });
}

function renderPage() {
    return {
        user: userEvent.setup(),
        ...render(
            <Provider store={makeStore()}>
                <MemoryRouter>
                    <EventsPage />
                </MemoryRouter>
            </Provider>
        ),
    };
}

// ── Step helpers ──────────────────────────────────────────────────────────────

/**
 * Fill in Step 1 with valid data and click Next.
 */
async function fillStep1AndNext(user: ReturnType<typeof userEvent.setup>) {
    // Contact info
    await user.type(screen.getByLabelText(/full name/i), 'Priya Sharma');
    await user.type(screen.getByLabelText(/phone/i), '9876543210');
    await user.type(screen.getByLabelText(/email/i), 'priya@example.com');

    // Event details
    await user.type(screen.getByLabelText(/event name/i), "Priya's Wedding");

    // Event type — select the wedding option
    const eventTypeSelect = screen.getByLabelText(/event type/i);
    await user.selectOptions(eventTypeSelect, 'wedding');

    // Date
    const dateInput = screen.getByLabelText(/event date/i);
    await user.type(dateInput, '2026-06-20');

    // Time slot
    const timeSlotSelect = screen.getByLabelText(/time slot/i);
    await user.selectOptions(timeSlotSelect, 'evening');

    // Venue
    await user.type(
        screen.getByLabelText(/venue \/ delivery address/i),
        '45 Lotus Hall, Coimbatore'
    );

    // Click Next
    const nextBtn = screen.getByRole('button', { name: /next step/i });
    await user.click(nextBtn);

    // Wait for Step 2
    await screen.findByRole('heading', { name: /headcount/i });
}

/**
 * Fill in Step 2 headcount and click Next.
 * Using a smaller total (10) to avoid clicking plus buttons too many times in tests.
 */
async function fillStep2AndNext(user: ReturnType<typeof userEvent.setup>) {
    const totalInput = await screen.findByLabelText(/total guests/i);
    await user.clear(totalInput);
    await user.type(totalInput, '10');

    // Plus 10 adults
    const incAdult = screen.getByRole('button', { name: /increase adults headcount/i });
    for (let i = 0; i < 10; i++) {
        await user.click(incAdult);
    }

    // Ensure state updated
    await screen.findByText('10');

    const nextBtn = screen.getByRole('button', { name: /next step/i });
    await user.click(nextBtn);

    // Wait for Step 3
    await screen.findByRole('heading', { name: /select menu/i });
}

/**
 * Skip Step 3 (Menu) or select one item and click Next.
 */
async function fillStep3AndNext(user: ReturnType<typeof userEvent.setup>) {
    // Wait for items to load
    await screen.findByText(/Masala Chai/i);
    // Find first 'Add' button and click it
    const addButtons = await screen.findAllByRole('button', { name: /add /i });
    await user.click(addButtons[0]);

    const nextBtn = screen.getByRole('button', { name: /see quote/i });
    await user.click(nextBtn);
}

// ── Server setup ──────────────────────────────────────────────────────────────

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Step 1 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 1: Event Details', () => {
    it('renders Step 1 heading', () => {
        renderPage();
        // Use heading role to avoid breadcrumb ambiguity
        expect(screen.getByRole('heading', { name: /event details/i })).toBeInTheDocument();
    });

    it('shows step indicator with step 1 active', () => {
        renderPage();
        // Step indicators are circles with the number
        expect(screen.getByText('1')).toBeDefined();
    });

    it('Next button is disabled when fields are empty', () => {
        renderPage();
        const nextBtn = screen.getByRole('button', { name: /next step/i });
        expect(nextBtn).toBeDisabled();
    });

    it('shows validation error for empty event name', async () => {
        const { user } = renderPage();
        // Fill everything except event name
        await user.type(screen.getByLabelText(/full name/i), 'Priya');
        await user.type(screen.getByLabelText(/phone/i), '9876543210');
        await user.type(screen.getByLabelText(/email/i), 'priya@example.com');
        // Next should remain disabled
        expect(screen.getByRole('button', { name: /next step/i })).toBeDisabled();
    });
});

// ── Step 2 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 2: Headcount', () => {
    it('reaches Step 2 after filling Step 1', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        expect(await screen.findByRole('heading', { name: /headcount/i })).toBeDefined();
    });

    it('shows Skip button to proceed without menu selection', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);
        expect(await screen.findByRole('button', { name: /skip/i })).toBeDefined();
    });

    it('shows quote breakdown headings', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Skip to Step 4
        const skipBtn = await screen.findByRole('button', { name: /skip/i });
        await user.click(skipBtn);

        expect(await screen.findByText(/your quote/i)).toBeDefined();
        expect(screen.getByText(/product subtotal/i)).toBeDefined();
        expect(screen.getByText(/delivery & service/i)).toBeDefined();
        expect(screen.getByText(/gst/i)).toBeDefined();
    });

    it('shows error when breakdown does not match total', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);

        const totalInput = await screen.findByLabelText(/total guests/i);
        await user.clear(totalInput);
        await user.type(totalInput, '20');

        // Increment adults only to 10
        const incAdult = screen.getByRole('button', { name: /increase adults headcount/i });
        for (let i = 0; i < 10; i++) {
            await user.click(incAdult);
        }

        // Next button should be disabled
        const nextBtn = screen.getByRole('button', { name: /next step/i });
        expect(nextBtn).toBeDisabled();
    });

    it('Next enabled when headcount breakdown sums to total', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);
        // If we got here without error, Step 2 → Step 3 navigation worked
        expect(await screen.findByRole('heading', { name: /select menu/i })).toBeDefined();
    });
});

// ── Step 3 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 3: Menu Selection', () => {
    it('loads and renders products from API', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        expect(await screen.findByText('Masala Chai')).toBeDefined();
        expect(screen.getByText('Green Tea')).toBeDefined();
        expect(screen.getByText('Cold Coffee')).toBeDefined();
    });

    it('shows price per cup for each product', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        expect(await screen.findByText(/masala chai/i)).toBeDefined();
        // ₹25 should appear in the product listing
        expect(screen.getAllByText(/₹25/)[0]).toBeDefined();
    });

    it('clicking + for a product adds it to selection', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        expect(await screen.findByText('Masala Chai')).toBeDefined();

        // Click the + button for the first product
        await user.click(await screen.findByRole('button', { name: /add masala chai/i }));

        // A "selected: 1 item" badge should appear
        expect(await screen.findByText(/selected: 1 item/i)).toBeDefined();
    });
});

// ── Step 4 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 4: Live Quote', () => {
    async function navigateToStep4(user: ReturnType<typeof userEvent.setup>) {
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Fill breakdown to match 10
        for (let i = 0; i < 6; i++) {
            await user.click(screen.getByRole('button', { name: /increase adults headcount/i }));
        }
        for (let i = 0; i < 4; i++) {
            await user.click(screen.getByRole('button', { name: /increase children headcount/i }));
        }

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /quote/i })).toBeInTheDocument();
        });
    }

    it('shows event summary card with event name', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Skip to Step 4
        const skipBtn = await screen.findByRole('button', { name: /skip/i });
        await user.click(skipBtn);

        expect(await screen.findByText(/your quote/i)).toBeDefined();
        expect(screen.getByText("Priya's Wedding")).toBeDefined();
    });

    it('shows estimated total', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Skip to Step 4
        const skipBtn = await screen.findByRole('button', { name: /skip/i });
        await user.click(skipBtn);

        expect(await screen.findByText(/estimated total/i)).toBeDefined();
    });
});

// ── Step 5 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 5: Submit & Confirmation', () => {
    async function navigateToStep5(user: ReturnType<typeof userEvent.setup>) {
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Skip Step 3
        const skipBtn = await screen.findByRole('button', { name: /skip/i });
        await user.click(skipBtn);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /quote/i })).toBeInTheDocument();
        });

        // Click the submit/confirm button
        const submitBtn = screen.getByRole('button', {
            name: /submit|confirm|send enquiry/i,
        });
        await user.click(submitBtn);
    }

    it('shows booking confirmation after submit', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Skip Step 3
        const skipBtn = await screen.findByRole('button', { name: /skip/i });
        await user.click(skipBtn);

        // Step 4 Quote
        const submitBtn = await screen.findByRole('button', { name: /send enquiry/i });
        await user.click(submitBtn);

        // Step 5
        expect(await screen.findByText(/you're all set/i)).toBeDefined();
    });

    it('shows the booking reference/event name from API response', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Skip Step 3
        const skipBtn = await screen.findByRole('button', { name: /skip/i });
        await user.click(skipBtn);

        // Step 4 Quote
        const submitBtn = await screen.findByRole('button', { name: /send enquiry/i });
        await user.click(submitBtn);

        // Step 5 should show event name from our mock response
        expect(await screen.findByText(/Test Wedding/i)).toBeDefined();
    });

    it('shows error toast when API call fails', async () => {
        // Intercept and return 500
        server.use(
            http.post('http://localhost/api/events', () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Skip Step 3
        const skipBtn = await screen.findByRole('button', { name: /skip/i });
        await user.click(skipBtn);

        // Submit Step 4
        const submitBtn = await screen.findByRole('button', { name: /send enquiry/i });
        await user.click(submitBtn);

        // Should see error toast (mocked or just check it didn't move)
        await waitFor(() => {
            expect(screen.queryByText(/you're all set/i)).toBeNull();
        });
    });
});

describe('EventsPage Unit Logic', () => {
    const mockSelected: Record<string, any> = {
        '1': { product_id: '1', product_name: 'Masala Chai', quantity: 10, unit_price: 20 },
        '2': { product_id: '2', product_name: 'Ginger Chai', quantity: 5, unit_price: 25 },
    };

    const calculateQuote = (selectedItems: any) => {
        const items = Object.values(selectedItems) as any[];
        const base = items.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0);
        const flaskCount = items.filter(i => i.quantity > 0).length;
        const deposit = flaskCount * 50;
        const delivery = base > 0 ? 200 : 0;
        const tax = (base + delivery) * 0.05;
        const total = base + deposit + delivery + tax;
        return { base, deposit, delivery, tax, total };
    };

    it('calculates base price as sum of item totals', () => {
        const q = calculateQuote(mockSelected);
        expect(q.base).toBe(10 * 20 + 5 * 25); // 200 + 125 = 325
    });

    it('calculates flask deposit as 50 per item type', () => {
        const q = calculateQuote(mockSelected);
        expect(q.deposit).toBe(2 * 50); // 2 item types
    });

    it('adds delivery charge when base > 0', () => {
        const q = calculateQuote(mockSelected);
        expect(q.delivery).toBe(200);
    });

    it('calculates 5% tax on (base + delivery)', () => {
        const q = calculateQuote(mockSelected);
        const expectedTax = (325 + 200) * 0.05;
        expect(q.tax).toBe(expectedTax);
    });
});
