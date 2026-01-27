import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/client';
import { Product } from '../../types';
import { getProductImageUrl } from '../../utils/images';

export const favoritesApi = createApi({
    reducerPath: 'favoritesApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Favorites'],
    endpoints: (builder) => ({
        // Get list of favorited product IDs (UUIDs) for quick UI check
        getFavoriteIds: builder.query<string[], void>({
            query: () => ({ url: '/favorites/ids', method: 'GET' }),
            providesTags: ['Favorites'],
        }),
        // Get full product details of favorites (for Profile page)
        getFavorites: builder.query<Product[], void>({
            query: () => ({ url: '/favorites', method: 'GET' }),
            transformResponse: (response: any[]) => response.map(item => ({
                ...item,
                price: item.base_price || item.price,
                image: getProductImageUrl(item.image_urls?.[0] || item.image),
            })),
            providesTags: ['Favorites'],
        }),
        addFavorite: builder.mutation<void, string>({
            query: (productId) => ({ url: `/products/${productId}/favorite`, method: 'POST' }),
            invalidatesTags: ['Favorites'],
        }),
        removeFavorite: builder.mutation<void, string>({
            query: (productId) => ({ url: `/products/${productId}/favorite`, method: 'DELETE' }),
            invalidatesTags: ['Favorites'],
        }),
    }),
});

export const {
    useGetFavoriteIdsQuery,
    useGetFavoritesQuery,
    useAddFavoriteMutation,
    useRemoveFavoriteMutation,
} = favoritesApi;
