import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { saveCartToIndexedDB, clearCartFromIndexedDB } from '../utils/indexedDB';
import { cartApi, AddToCartRequest, CartCustomizationRequest } from '../features/cart/cartApi';

/**
 * Redux middleware that automatically persists cart changes
 * - Guest users: IndexedDB storage
 * - Authenticated users: Backend API calls (handled by async thunks, not this middleware)
 *
 * Note: For authenticated users, we use async thunks (addItemToBackend, etc.)
 * This middleware only handles IndexedDB persistence for guest users.
 */
export const cartPersistenceMiddleware: Middleware = (store) => (next) => (action: AnyAction) => {
    // Let the action pass through first
    const result = next(action);

    // Check if this is a cart action that needs persistence for guests
    const guestCartActions = [
        'cart/addItem',
        'cart/removeItem',
        'cart/updateQuantity',
        'cart/clearCart',
        'cart/setCartItems'
    ];

    if (guestCartActions.includes(action.type)) {
        // Get current state after action
        const state = store.getState();
        const { isAuthenticated } = state.auth;

        // Only persist to IndexedDB for guest users
        // Authenticated users use async thunks that call backend directly
        if (!isAuthenticated) {
            const { items } = state.cart;

            // Persist asynchronously without blocking
            if (action.type === 'cart/clearCart') {
                clearCartFromIndexedDB().catch(err => {
                    console.error('Failed to clear cart from IndexedDB:', err);
                });
            } else {
                saveCartToIndexedDB(items).catch(err => {
                    console.error('Failed to save cart to IndexedDB:', err);
                });
            }
        }
    }

    return result;
};
