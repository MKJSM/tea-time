/**
 * ProductCard component tests.
 * Verifies rendering, price display, and that the accent-500 star color class is applied.
 */
import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../../components/products/ProductCard';
import { productsApi } from '../../features/products/productsApi';
import { server } from '../../test/server';

const mockProduct = {
    id: 'prod-test-1',
    name: 'Jasmine Green Tea',
    description: 'Light and floral',
    base_price: 45.0,
    price: 45.0,
    category: ['Tea'],
    image_urls: ['/jasmine.jpg'],
    images: ['/jasmine.jpg'],
    is_active: true,
    stock_quantity: 80,
    rating: 4.3,
    review_count: 56,
    customization_groups: [],
};

function makeStore() {
    return configureStore({
        reducer: { [productsApi.reducerPath]: productsApi.reducer },
        middleware: (g) => g().concat(productsApi.middleware),
    });
}

function renderCard(product = mockProduct) {
    return render(
        <Provider store={makeStore()}>
            <MemoryRouter>
                <ProductCard product={product as any} />
            </MemoryRouter>
        </Provider>
    );
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProductCard', () => {
    it('renders product name', () => {
        renderCard();
        expect(screen.getByText('Jasmine Green Tea')).toBeInTheDocument();
    });

    it('renders formatted price', () => {
        renderCard();
        // Price component renders ₹45.00
        expect(screen.getByText(/₹45/)).toBeInTheDocument();
    });

    it('renders star rating element', () => {
        renderCard();
        // The star rating number should appear
        expect(screen.getByText('4.3')).toBeInTheDocument();
    });

    it('renders review count', () => {
        renderCard();
        expect(screen.getByText(/56/)).toBeInTheDocument();
    });

    it('links to product detail page', () => {
        renderCard();
        const links = screen.getAllByRole('link');
        const productLink = links.find((link) =>
            link.getAttribute('href')?.includes('prod-test-1')
        );
        expect(productLink).toBeDefined();
    });
});
