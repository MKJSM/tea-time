
import { createApi } from '@reduxjs/toolkit/query/react';
import { Product } from '../../types';
import { axiosBaseQuery } from '../../api/client';
import { transformProduct } from '../../utils/images';

// Backend paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
}

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    // Paginated products query - returns full pagination info
    getProductsPaginated: builder.query<PaginatedResponse<Product>, ProductsQueryParams>({
      query: (params) => ({
        url: '/products',
        method: 'GET',
        params: { page: 1, limit: 12, ...params }
      }),
      transformResponse: (response: PaginatedResponse<Product>) => ({
        ...response,
        data: response.data.map(transformProduct)
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ id }) => ({ type: 'Product' as const, id })), { type: 'Product', id: 'LIST' }]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    // Legacy query for backwards compatibility (returns array only)
    getProducts: builder.query<Product[], ProductsQueryParams>({
      query: (params) => ({
        url: '/products',
        method: 'GET',
        params: params || {}
      }),
      // Transform paginated response to array and fix images
      transformResponse: (response: PaginatedResponse<Product>) => response.data.map(transformProduct),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Product' as const, id })), { type: 'Product', id: 'LIST' }]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getProductById: builder.query({
      query: (id: string) => ({ url: `/products/${id}`, method: 'GET' }),
      transformResponse: (response: Product) => transformProduct(response),
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getFeaturedProducts: builder.query({
      query: () => ({ url: '/products', method: 'GET' }),
      transformResponse: (response: PaginatedResponse<Product>) => response.data.slice(0, 4).map(transformProduct),
    }),
    getCategories: builder.query<string[], void>({
      query: () => ({ url: '/products/categories', method: 'GET' }),
      providesTags: ['Product'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductsPaginatedQuery,
  useGetProductByIdQuery,
  useGetFeaturedProductsQuery,
  useGetCategoriesQuery,
} = productsApi;
