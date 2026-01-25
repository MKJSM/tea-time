
import { createApi } from '@reduxjs/toolkit/query/react';
import { Product } from '../../types';
import { axiosBaseQuery } from '../../api/client';

// Backend paginated response type
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], { page?: number; limit?: number; q?: string; category?: string }>({
      query: (params) => ({
        url: '/products',
        method: 'GET',
        params: params || {}
      }),
      // Transform paginated response to array
      transformResponse: (response: PaginatedResponse<Product>) => response.data,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Product' as const, id })), { type: 'Product', id: 'LIST' }]
          : [{ type: 'Product', id: 'LIST' }],
      // Merge results for infinite scroll
      merge: (currentCache, newItems, { arg }) => {
        if (arg?.page && arg.page > 1) {
          return [...currentCache, ...newItems];
        }
        return newItems;
      },
      // Force refetch on filter change to clear cache
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page ||
          currentArg?.q !== previousArg?.q ||
          currentArg?.category !== previousArg?.category;
      },
    }),
    getProductById: builder.query({
      query: (id: string) => ({ url: `/products/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getFeaturedProducts: builder.query({
      query: () => ({ url: '/products', method: 'GET' }),
      transformResponse: (response: PaginatedResponse<Product>) => response.data.slice(0, 4),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetFeaturedProductsQuery
} = productsApi;
