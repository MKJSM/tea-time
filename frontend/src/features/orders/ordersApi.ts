
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/client';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: () => ({ url: '/orders', method: 'GET' }),
    }),
    getOrderById: builder.query({
      query: (id: string) => ({ url: `/orders/${id}`, method: 'GET' }),
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderByIdQuery } = ordersApi;
