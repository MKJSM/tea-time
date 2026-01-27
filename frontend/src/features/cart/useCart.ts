import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Product, SelectedAttributes, CustomBlend } from '../../types';
import {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    addItemToBackend,
    updateItemOnBackend,
    removeItemFromBackend,
} from './cartSlice';
import { cartApi } from './cartApi';

/**
 * Custom hook for cart operations that automatically handles
 * guest vs authenticated user scenarios
 */
export const useCart = () => {
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const { items, isLoading, isDrawerOpen } = useAppSelector((state) => state.cart);

    /**
     * Add item to cart - uses backend API for authenticated users,
     * local state for guests
     */
    const addToCart = useCallback(
        (product: Product, quantity: number, customization?: CustomBlend, selectedAttributes?: SelectedAttributes) => {
            if (isAuthenticated) {
                // Authenticated user - call backend
                dispatch(addItemToBackend({ product, quantity, selectedAttributes }));
            } else {
                // Guest user - local state only
                dispatch(addItem({ product, quantity, customization, selectedAttributes }));
            }
        },
        [dispatch, isAuthenticated]
    );

    /**
     * Update item quantity - uses backend API for authenticated users,
     * local state for guests
     */
    const updateItemQuantity = useCallback(
        (itemKey: string, quantity: number) => {
            if (isAuthenticated) {
                // For authenticated users, itemKey is the backend item ID
                dispatch(updateItemOnBackend({ itemId: itemKey, quantity }));
            } else {
                // Guest user - local state only
                dispatch(updateQuantity({ itemKey, quantity }));
            }
        },
        [dispatch, isAuthenticated]
    );

    /**
     * Remove item from cart - uses backend API for authenticated users,
     * local state for guests
     */
    const removeFromCart = useCallback(
        (itemKey: string) => {
            if (isAuthenticated) {
                // For authenticated users, itemKey is the backend item ID
                dispatch(removeItemFromBackend(itemKey));
            } else {
                // Guest user - local state only
                dispatch(removeItem(itemKey));
            }
        },
        [dispatch, isAuthenticated]
    );

    /**
     * Clear entire cart - for now only clears local state
     * Backend cart clearing can be added if needed
     */
    const clearEntireCart = useCallback(() => {
        dispatch(clearCart());
        // For authenticated users, we might want to clear backend cart too
        // but for now this is sufficient for local needs
    }, [dispatch]);

    /**
     * Calculate cart total including attribute adjustments
     */
    const cartTotal = items.reduce((total, item) => {
        let unitPrice = item.price;
        if (item.attributes && item.selectedAttributes) {
            item.attributes.forEach(attr => {
                const selectedValue = item.selectedAttributes![attr.id];
                if (selectedValue) {
                    const option = attr.options.find(o => o.value === selectedValue);
                    if (option) unitPrice += option.priceAdjustment;
                }
            });
        }
        return total + unitPrice * item.quantity;
    }, 0);

    /**
     * Get item count
     */
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return {
        items,
        isLoading,
        isDrawerOpen,
        isAuthenticated,
        cartTotal,
        itemCount,
        addToCart,
        updateItemQuantity,
        removeFromCart,
        clearEntireCart,
    };
};

export default useCart;
