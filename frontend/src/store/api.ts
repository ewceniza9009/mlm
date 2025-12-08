import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from './index';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5000/api/v1/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Tree', 'Wallet', 'SystemLogs', 'Commissions'],
  endpoints: (builder) => ({
    getTree: builder.query({
      query: (rootId) => `network/tree${rootId ? `?rootId=${rootId}` : ''}`,
      providesTags: ['Tree'],
    }),
    getUpline: builder.query({
      query: (userId) => `network/upline?userId=${userId}`,
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: 'auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    getWallet: builder.query({
      query: () => 'wallet',
      providesTags: ['Wallet'],
    }),
    requestWithdrawal: builder.mutation({
      query: (data) => ({
        url: 'wallet/withdraw',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet'],
    }),
    updateProfile: builder.mutation({
        query: (data) => ({
            url: 'auth/profile',
            method: 'PUT',
            body: data
        }),
        invalidatesTags: ['User']
    }),
    getSystemLogs: builder.query({
        query: () => 'admin/logs',
        providesTags: ['SystemLogs']
    }),    
    getAdminCommissions: builder.query({
        query: () => 'admin/commissions',
        providesTags: ['Commissions']
    }),
    runCommissions: builder.mutation({
      query: () => ({
        url: 'admin/run-commissions',
        method: 'POST',
      }),
      invalidatesTags: ['Wallet', 'User', 'SystemLogs', 'Commissions'],
    }),
  }),
});

export const { 
  useGetTreeQuery, 
  useLoginMutation, 
  useRegisterMutation, 
  useGetUplineQuery,
  useGetWalletQuery,
  useRequestWithdrawalMutation,
  useUpdateProfileMutation,
  useRunCommissionsMutation,
  useGetSystemLogsQuery,
  useGetAdminCommissionsQuery
} = api;