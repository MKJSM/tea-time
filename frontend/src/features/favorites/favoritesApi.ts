import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/client';
import { Product } from '../../types';

export const favoritesApi = createApi({
    reducerPath: 'favoritesApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Favorites'],
    endpoints: (builder) => ({
        // Get list of favorited product IDs (for quick UI check)
        getFavoriteIds: builder.query<number[], void>({
            query: () => ({ url: '/favorites/ids', method: 'GET' }),
            providesTags: ['Favorites'],
        }),
        // Get full product details of favorites (for Profile page)
        getFavorites: builder.query<Product[], void>({
            query: () => ({ url: '/favorites', method: 'GET' }),
            providesTags: ['Favorites'],
        }),
        addFavorite: builder.mutation<void, number>({
            query: (productId) => ({ url: `/products/${productId}/favorite`, method: 'POST' }),
            invalidatesTags: ['Favorites'],
        }),
        removeFavorite: builder.mutation<void, number>({
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
