
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/client';
import { transformProduct } from '../../utils/images';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: () => ({ url: '/orders', method: 'GET' }),
      transformResponse: (response: any[]) => response.map(order => ({
        ...order,
        items: order.items.map((item: any) => transformProduct(item))
      })),
    }),
    getOrderById: builder.query({
      query: (id: string) => ({ url: `/orders/${id}`, method: 'GET' }),
      transformResponse: (order: any) => ({
        ...order,
        items: order.items.map((item: any) => transformProduct(item))
      }),
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderByIdQuery } = ordersApi;
