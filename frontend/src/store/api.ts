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
      query: (params) => {
        if (!params) return 'wallet';
        const qs = new URLSearchParams(params).toString();
        return `wallet?${qs}`;
      },
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
      query: (params) => {
        const qs = new URLSearchParams(params).toString();
        return `admin/logs?${qs}`;
      },
      providesTags: ['SystemLogs']
    }),
    getAdminCommissions: builder.query({
      query: (params) => {
        const qs = new URLSearchParams(params).toString();
        return `admin/commissions?${qs}`;
      },
      providesTags: ['Commissions']
    }),
    runCommissions: builder.mutation({
      query: () => ({
        url: 'admin/run-commissions',
        method: 'POST',
      }),
      invalidatesTags: ['Wallet', 'User', 'SystemLogs', 'Commissions'],
    }),
    getConfig: builder.query({
      query: () => 'admin/config',
    }),
    updateConfig: builder.mutation({
      query: (data) => ({
        url: 'admin/config',
        method: 'PUT',
        body: data,
      }),
      // Invalidate nothing or maybe refetch config if needed, but result returns new config
    }),

    // Holding Tank & Search
    getHoldingTank: builder.query<any, void>({
      query: () => 'network/holding-tank',
      providesTags: ['Tree'],
    }),
    placeMember: builder.mutation<any, { userId: string, targetParentId: string, position: 'left' | 'right' }>({
      query: (data) => ({
        url: 'network/place-member',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tree'],
    }),
    searchDownline: builder.query<any[], string>({
      query: (query) => `network/search-downline?query=${query}`,
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
  useGetAdminCommissionsQuery,
  useGetConfigQuery,
  useUpdateConfigMutation,
  useGetHoldingTankQuery,
  usePlaceMemberMutation,
  useLazySearchDownlineQuery
} = api;