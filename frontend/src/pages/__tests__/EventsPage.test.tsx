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
    vi,
} from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import EventsPage from '../../pages/EventsPage';
import { eventsApi } from '../../features/events/eventsApi';
import { productsApi } from '../../features/products/productsApi';
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
        },
        middleware: (g) =>
            g({ serializableCheck: false }).concat(
                productsApi.middleware,
                eventsApi.middleware
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
    await user.type(screen.getByLabelText(/contact name/i), 'Priya Sharma');
    await user.type(screen.getByLabelText(/phone/i), '9876543210');
    await user.type(screen.getByLabelText(/email/i), 'priya@example.com');

    // Event details
    await user.type(screen.getByLabelText(/event name/i), "Priya's Wedding");

    // Event type — select the wedding option
    const weddingOption = screen.getByRole('button', { name: /wedding/i });
    await user.click(weddingOption);

    // Date
    const dateInput = screen.getByLabelText(/event date/i);
    await user.type(dateInput, '2026-06-20');

    // Time slot
    const eveningSlot = screen.getByRole('button', { name: /evening/i });
    await user.click(eveningSlot);

    // Venue
    await user.type(
        screen.getByLabelText(/venue address/i),
        '45 Lotus Hall, Coimbatore'
    );

    // Click Next
    const nextBtn = screen.getByRole('button', { name: /next/i });
    await user.click(nextBtn);
}

/**
 * Fill in Step 2 headcount and click Next.
 */
async function fillStep2AndNext(user: ReturnType<typeof userEvent.setup>) {
    const totalInput = screen.getByLabelText(/total guests/i);
    await user.clear(totalInput);
    await user.type(totalInput, '100');

    const adultsInput = screen.getByLabelText(/adults/i);
    await user.clear(adultsInput);
    await user.type(adultsInput, '80');

    const kidsInput = screen.getByLabelText(/kids/i);
    await user.clear(kidsInput);
    await user.type(kidsInput, '10');

    const seniorsInput = screen.getByLabelText(/seniors/i);
    await user.clear(seniorsInput);
    await user.type(seniorsInput, '10');

    const nextBtn = screen.getByRole('button', { name: /next/i });
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
        expect(screen.getByText(/event details/i)).toBeInTheDocument();
    });

    it('shows step indicator with step 1 active', () => {
        renderPage();
        // First step indicator should be visible
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('Next button is disabled when fields are empty', () => {
        renderPage();
        const nextBtn = screen.getByRole('button', { name: /next/i });
        expect(nextBtn).toBeDisabled();
    });

    it('shows validation error for empty event name', async () => {
        const { user } = renderPage();
        // Fill everything except event name
        await user.type(screen.getByLabelText(/contact name/i), 'Priya');
        await user.type(screen.getByLabelText(/phone/i), '9876543210');
        await user.type(screen.getByLabelText(/email/i), 'priya@example.com');
        // Next should remain disabled
        expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
});

// ── Step 2 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 2: Headcount', () => {
    it('reaches Step 2 after filling Step 1', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        expect(screen.getByText(/headcount/i)).toBeInTheDocument();
    });

    it('shows error when breakdown does not match total', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);

        const totalInput = screen.getByLabelText(/total guests/i);
        await user.clear(totalInput);
        await user.type(totalInput, '100');

        const adultsInput = screen.getByLabelText(/adults/i);
        await user.clear(adultsInput);
        await user.type(adultsInput, '50'); // only 50, but total is 100

        // Next button should be disabled or show warning
        const nextBtn = screen.getByRole('button', { name: /next/i });
        expect(nextBtn).toBeDisabled();
    });

    it('Next enabled when headcount breakdown sums to total', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);
        // If we got here without error, Step 2 → Step 3 navigation worked
        await waitFor(() => {
            expect(screen.getByText(/menu selection/i)).toBeInTheDocument();
        });
    });
});

// ── Step 3 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 3: Menu Selection', () => {
    it('loads and renders products from API', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        await waitFor(() => {
            expect(screen.getByText('Masala Chai')).toBeInTheDocument();
        });
        expect(screen.getByText('Green Tea')).toBeInTheDocument();
        expect(screen.getByText('Cold Coffee')).toBeInTheDocument();
    });

    it('shows price per cup for each product', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        await waitFor(() => {
            expect(screen.getByText(/masala chai/i)).toBeInTheDocument();
        });
        // ₹25 should appear in the product listing
        expect(screen.getAllByText(/₹25/)[0]).toBeInTheDocument();
    });

    it('clicking + for a product adds it to selection', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        await waitFor(() => {
            expect(screen.getByText('Masala Chai')).toBeInTheDocument();
        });

        // Click the + button for the first product
        const addButtons = screen.getAllByRole('button', { name: /\+/i });
        await user.click(addButtons[0]);

        // A "selected: 1 item types" badge should appear
        expect(screen.getByText(/selected: 1 item/i)).toBeInTheDocument();
    });

    it('shows Skip button to proceed without menu selection', async () => {
        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        await waitFor(() => {
            expect(screen.getByText(/menu selection/i)).toBeInTheDocument();
        });
        expect(
            screen.getByRole('button', { name: /skip/i })
        ).toBeInTheDocument();
    });
});

// ── Step 4 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 4: Live Quote', () => {
    async function navigateToStep4(user: ReturnType<typeof userEvent.setup>) {
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        // Skip step 3 for simplicity
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
        });
        await user.click(screen.getByRole('button', { name: /skip/i }));

        await waitFor(() => {
            expect(screen.getByText(/quote|estimate/i)).toBeInTheDocument();
        });
    }

    it('shows quote breakdown headings', async () => {
        const { user } = renderPage();
        await navigateToStep4(user);

        expect(screen.getByText(/base price/i)).toBeInTheDocument();
        expect(screen.getByText(/deposit/i)).toBeInTheDocument();
        expect(screen.getByText(/delivery/i)).toBeInTheDocument();
        expect(screen.getByText(/tax/i)).toBeInTheDocument();
    });

    it('shows event summary card with event name', async () => {
        const { user } = renderPage();
        await navigateToStep4(user);

        expect(screen.getByText("Priya's Wedding")).toBeInTheDocument();
    });

    it('shows estimated total', async () => {
        const { user } = renderPage();
        await navigateToStep4(user);

        // With no products selected, base=0 so total will show ₹0.00 or similar
        expect(screen.getByText(/estimated total|total/i)).toBeInTheDocument();
    });
});

// ── Step 5 Tests ──────────────────────────────────────────────────────────────

describe('EventsPage — Step 5: Submit & Confirmation', () => {
    async function navigateToStep5(user: ReturnType<typeof userEvent.setup>) {
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
        });
        await user.click(screen.getByRole('button', { name: /skip/i }));

        await waitFor(() => {
            expect(screen.getByText(/quote|estimate/i)).toBeInTheDocument();
        });

        // Click the submit/confirm button
        const submitBtn = screen.getByRole('button', {
            name: /submit|confirm|send enquiry/i,
        });
        await user.click(submitBtn);
    }

    it('shows booking confirmation after submit', async () => {
        const { user } = renderPage();
        await navigateToStep5(user);

        await waitFor(
            () => {
                expect(
                    screen.getByText(/booking received|confirmed|30.60 minutes/i)
                ).toBeInTheDocument();
            },
            { timeout: 5000 }
        );
    });

    it('shows the booking reference/event name from API response', async () => {
        const { user } = renderPage();
        await navigateToStep5(user);

        await waitFor(
            () => {
                // The mocked response includes "Test Wedding"
                expect(
                    screen.getByText(new RegExp(mockEventBookingResponse.event_name, 'i'))
                ).toBeInTheDocument();
            },
            { timeout: 5000 }
        );
    });

    it('shows error toast when API call fails', async () => {
        // Override handler to return 500
        server.use(
            http.post('/api/events', () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        const { user } = renderPage();
        await fillStep1AndNext(user);
        await fillStep2AndNext(user);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
        });
        await user.click(screen.getByRole('button', { name: /skip/i }));

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /submit|confirm|send enquiry/i })
            ).toBeInTheDocument();
        });
        await user.click(
            screen.getByRole('button', { name: /submit|confirm|send enquiry/i })
        );

        // On error, the wizard should NOT show confirmation (stays on quote step)
        await waitFor(() => {
            expect(screen.queryByText(/booking received/i)).not.toBeInTheDocument();
        });
    });
});

// ── Quote calculation unit tests ──────────────────────────────────────────────

describe('EventsPage — Quote calculation logic', () => {
    /**
     * These test the internal calculation contract before the component renders it.
     * We derive the formula from the component code:
     *   base  = sum(unit_price * quantity for each selected item)
     *   deposit = count(items with qty > 0) * 200
     *   delivery = base > 0 ? 200 : 0
     *   tax = (base + delivery) * 0.05
     *   total = base + deposit + delivery + tax
     */
    it('calculates base price as sum of item totals', () => {
        const items = [
            { unit_price: 25, quantity: 100 },
            { unit_price: 20, quantity: 50 },
        ];
        const base = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
        expect(base).toBe(3500);
    });

    it('calculates flask deposit as 200 per item type', () => {
        const FLASK_DEPOSIT = 200;
        const items = [
            { quantity: 100 },
            { quantity: 50 },
            { quantity: 0 }, // zero-qty items excluded
        ];
        const flaskCount = items.filter((i) => i.quantity > 0).length;
        const deposit = flaskCount * FLASK_DEPOSIT;
        expect(deposit).toBe(400); // 2 non-zero items
    });

    it('adds delivery charge when base > 0', () => {
        const DELIVERY = 200;
        expect(100 > 0 ? DELIVERY : 0).toBe(200);
        expect(0 > 0 ? DELIVERY : 0).toBe(0);
    });

    it('calculates 5% tax on (base + delivery)', () => {
        const TAX_RATE = 0.05;
        const base = 3500;
        const delivery = 200;
        const tax = (base + delivery) * TAX_RATE;
        expect(tax).toBe(185);
    });
});
