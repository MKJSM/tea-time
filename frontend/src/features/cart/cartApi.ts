import apiClient from '../../api/client';

// Types matching Backend DTOs - All IDs are UUIDs (strings)
export interface CartCustomizationRequest {
    group_id: string;
    option_id: string;
}

export interface AddToCartRequest {
    product_id: string;
    quantity: number;
    customizations: CartCustomizationRequest[];
}

export interface MergeCartItem {
    product_id: string;
    quantity: number;
    customizations: CartCustomizationRequest[];
}

export interface MergeCartRequest {
    items: MergeCartItem[];
}

// Backend response types
export interface CartCustomizationDto {
    group_name: string;
    option_name: string;
    price_modifier: number;
}

export interface CartItemDto {
    id: string | null;
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    customizations: CartCustomizationDto[];
    total_price: number;
    image_urls: string[];
}

export interface CartDto {
    items: CartItemDto[];
    total: number;
}

export const cartApi = {
    getCart: () => apiClient.get<CartDto>('/cart'),

    addToCart: (data: AddToCartRequest) =>
        apiClient.post<CartDto>('/cart', data),

    updateItem: (itemId: string, quantity: number) =>
        apiClient.put<CartDto>(`/cart/items/${itemId}`, { quantity }),

    removeItem: (itemId: string) =>
        apiClient.delete<CartDto>(`/cart/items/${itemId}`),

    mergeCart: (data: MergeCartRequest) =>
        apiClient.post<CartDto>('/cart/merge', data),
};
