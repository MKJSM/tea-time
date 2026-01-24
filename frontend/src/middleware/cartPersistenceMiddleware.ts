import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { saveCartToIndexedDB, clearCartFromIndexedDB } from '../utils/indexedDB';

/**
 * Redux middleware that automatically persists cart changes to IndexedDB for guest users
 * Authenticated users' carts are handled by the backend
 */
export const cartPersistenceMiddleware: Middleware = (store) => (next) => (action: AnyAction) => {
    // Let the action pass through first
    const result = next(action);

    // Check if this is a cart action that needs persistence
    const cartActions = [
        'cart/addItem',
        'cart/removeItem',
        'cart/updateQuantity',
        'cart/clearCart',
        'cart/setCartItems'
    ];

    if (cartActions.includes(action.type)) {
        // Get current state after action
        const state = store.getState();
        const { isAuthenticated } = state.auth;

        // Only persist to IndexedDB for guest users
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
        // For authenticated users, backend handles persistence
    }

    return result;
};
