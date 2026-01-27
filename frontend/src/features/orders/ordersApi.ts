
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/client';
import { transformProduct, getProductImageUrl } from '../../utils/images';
import { OrderSummary } from '../../types';

export interface CreateOrderRequest {
  address_id: string;
  notes?: string;
}
export interface InitiatePaymentResponse {
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
  order_id: string;
  order_number: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  order_id: string;
  order_number: string;
  payment_id: string;
  message: string;
}

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getOrders: builder.query<OrderSummary[], void>({
      query: () => ({ url: '/orders', method: 'GET' }),
      transformResponse: (response: any[]) => response.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
        item_count: order.item_count,
        created_at: order.created_at
      })),
      providesTags: ['Orders'],
    }),
    getOrderById: builder.query({
      query: (id: string) => ({ url: `/orders/${id}`, method: 'GET' }),
      transformResponse: (order: any) => ({
        ...order,
        id: order.id,
        orderNumber: order.order_number,
        date: order.created_at,
        status: order.status,
        subtotal: order.subtotal,
        tax: (order.tax_cgst || 0) + (order.tax_sgst || 0),
        shippingCost: order.delivery_charge,
        total: order.total_amount,
        deliveryAddress: order.address ? `${order.address.recipient_name}, ${order.address.street_address}, ${order.address.city}, ${order.address.state} ${order.address.postal_code}` : '',
        timeline: order.timeline || [],
        items: order.items.map((item: any) => ({
          ...item,
          id: item.product_id, // Use Product ID for cart compatibility
          orderItemId: item.id, // Preserve Order Item ID
          name: item.product_name,
          price: item.unit_price,
          quantity: item.quantity,
          image: item.product_image_urls?.[0] ? getProductImageUrl(item.product_image_urls[0]) : '',
          categories: ['Tea'], // Default category as backend doesn't return it yet
          origin: 'India' // Default origin
        }))
      }),
    }),
    createOrder: builder.mutation<any, CreateOrderRequest>({
      query: (data) => ({
        url: '/orders',
        method: 'POST',
        body: data,
      }),
    }),
    initiatePayment: builder.mutation<InitiatePaymentResponse, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/pay`,
        method: 'POST',
      }),
    }),
    verifyPayment: builder.mutation<PaymentVerificationResponse, VerifyPaymentRequest>({
      query: (data) => ({
        url: '/payments/verify',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Orders'],
    }),
    cancelOrder: builder.mutation<any, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => ['Orders'],
    }),
    getPayments: builder.query<any, void>({
      query: () => ({ url: '/payments', method: 'GET' }),
    }),
    getPaymentById: builder.query<any, string>({
      query: (id) => ({ url: `/payments/${id}`, method: 'GET' }),
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useInitiatePaymentMutation,
  useVerifyPaymentMutation
} = ordersApi;
