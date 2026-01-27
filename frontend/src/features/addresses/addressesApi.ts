import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../../types';

export const addressesApi = createApi({
  reducerPath: 'addressesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
  }),
  tagTypes: ['Address'],
  endpoints: (builder) => ({
    getAddresses: builder.query<Address[], void>({
      query: () => '/user/addresses',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Address' as const, id })),
              { type: 'Address', id: 'LIST' },
            ]
          : [{ type: 'Address', id: 'LIST' }],
    }),

    getAddress: builder.query<Address, string>({
      query: (id) => `/user/addresses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Address', id }],
    }),

    createAddress: builder.mutation<Address, CreateAddressRequest>({
      query: (body) => ({
        url: '/user/addresses',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Address', id: 'LIST' }],
    }),

    updateAddress: builder.mutation<Address, { id: string; data: UpdateAddressRequest }>({
      query: ({ id, data }) => ({
        url: `/user/addresses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Address', id },
        { type: 'Address', id: 'LIST' },
      ],
    }),

    deleteAddress: builder.mutation<void, string>({
      query: (id) => ({
        url: `/user/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Address', id: 'LIST' }],
    }),

    setDefaultAddress: builder.mutation<Address, string>({
      query: (id) => ({
        url: `/user/addresses/${id}/default`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Address', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useGetAddressQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} = addressesApi;
