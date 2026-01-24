
import { createApi } from '@reduxjs/toolkit/query/react';
import { Product } from '../../types';
import { axiosBaseQuery } from '../../api/client';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => ({ url: '/products', method: 'GET' }),
      providesTags: (result: Product[] | undefined) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Product' as const, id })), { type: 'Product', id: 'LIST' }]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getProductById: builder.query({
      query: (id: string) => ({ url: `/products/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getFeaturedProducts: builder.query({
      query: () => ({ url: '/products', method: 'GET' }),
      transformResponse: (response: Product[]) => response.slice(0, 4),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetFeaturedProductsQuery
} = productsApi;
