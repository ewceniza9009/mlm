import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from './index';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Wallet', 'Tree', 'Packages', 'Tickets', 'Withdrawals', 'Admin', 'SystemLogs', 'Notifications', 'Settings', 'Products', 'Wishlist'],
  endpoints: (builder) => ({
    getTree: builder.query({
      query: (rootId) => `network/tree${rootId ? `?rootId=${rootId}` : ''}`,
      providesTags: ['Tree'],
    }),
    getUpline: builder.query({
      query: ({ userId, levels }) => `network/upline?userId=${userId}&levels=${levels || 5}`,
    }),
    getMemberDetails: builder.query({
      query: (memberId) => `network/member/${memberId}`,
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
        const cleaned = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
        const qs = new URLSearchParams(cleaned as any).toString();
        return `admin/logs?${qs}`;
      },
      providesTags: ['SystemLogs']
    }),
    getAdminCommissions: builder.query({
      query: (params) => {
        if (!params) return 'admin/commissions';
        const qs = new URLSearchParams(params).toString();
        return `admin/commissions?${qs}`;
      },
      providesTags: ['Admin'],
    }),
    getAdminStats: builder.query({
      query: () => 'admin/stats',
      providesTags: ['Admin'],
    }),
    runCommissions: builder.mutation({
      query: () => ({
        url: 'admin/run-commissions',
        method: 'POST',
      }),
      invalidatesTags: ['Wallet', 'Admin'],
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

    // Package Management
    getAllUsers: builder.query({
      query: (params) => {
        const cleaned = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
        const qs = new URLSearchParams(cleaned as any).toString();
        return `admin/users?${qs}`;
      },
      providesTags: ['Admin']
    }),
    updateUserRole: builder.mutation({
      query: (body) => ({
        url: 'admin/users/role',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Admin']
    }),
    toggleUserStatus: builder.mutation({
      query: (body) => ({
        url: 'admin/users/status',
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Admin']
    }),

    getPackages: builder.query({
      query: (isAdmin) => `packages${isAdmin ? '?all=true' : ''}`,
      providesTags: ['Packages'],
    }),
    getShopStatus: builder.query({
      query: () => 'shop/status',
      providesTags: ['Settings'],
    }),
    createPackage: builder.mutation({
      query: (body) => ({
        url: 'packages',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Packages'],
    }),
    updatePackage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `packages/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Packages'],
    }),
    deletePackage: builder.mutation({
      query: (id) => ({
        url: `packages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Packages'],
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
    getEarningsAnalytics: builder.query({
      query: () => 'analytics/earnings',
    }),
    getGrowthAnalytics: builder.query({
      query: () => 'analytics/growth',
    }),

    // Support
    getTickets: builder.query<any[], void>({
      query: () => 'support',
      providesTags: ['Tickets'],
    }),
    getAllTickets: builder.query<any[], void>({
      query: () => 'support/all',
      providesTags: ['Tickets'],
    }),
    createTicket: builder.mutation({
      query: (body) => ({
        url: 'support',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tickets'],
    }),
    replyTicket: builder.mutation({
      query: ({ ticketId, message }) => ({
        url: `support/${ticketId}/reply`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Tickets'],
    }),
    updateTicketStatus: builder.mutation({
      query: ({ ticketId, status }) => ({
        url: `support/${ticketId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Tickets'],
    }),

    // Admin Withdrawals
    getPendingWithdrawals: builder.query({
      query: (params) => {
        const cleaned = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
        const qs = new URLSearchParams(cleaned as any).toString();
        return `wallet/admin/withdrawals?${qs}`;
      },
      providesTags: ['Withdrawals'],
    }),
    processWithdrawal: builder.mutation({
      query: (body) => ({
        url: 'wallet/admin/process-withdrawal',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Withdrawals', 'Wallet'],
    }),

    // Security (KYC & 2FA)
    uploadKYC: builder.mutation({
      query: (formData) => ({
        url: 'security/kyc/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
    getPendingKYC: builder.query<any[], void>({
      query: () => 'security/kyc/pending',
      providesTags: ['User'],
    }),
    updateKYCStatus: builder.mutation({
      query: (body) => ({
        url: 'security/kyc/status',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    generate2FA: builder.mutation({
      query: () => ({
        url: 'security/2fa/generate',
        method: 'POST',
      }),
    }),
    verify2FA: builder.mutation({
      query: (body) => ({
        url: 'security/2fa/verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    disable2FA: builder.mutation({
      query: (body) => ({
        url: 'security/2fa/disable',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // Notifications
    getNotifications: builder.query<any[], void>({
      query: () => 'notifications',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: 'notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    seedNotifications: builder.mutation({
      query: () => ({
        url: 'notifications/seed',
        method: 'POST',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // Settings
    getSettings: builder.query<Record<string, any>, void>({
      query: () => 'settings',
      providesTags: ['Settings'],
    }),
    getPublicSettings: builder.query<Record<string, any>, void>({
      query: () => 'settings/public',
    }),
    updateSetting: builder.mutation<any, { key: string; value: any }>({
      query: (body) => ({
        url: 'settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),
    // Shop & Orders
    getShopProducts: builder.query({
      query: () => 'shop/shop',
    }),
    getPublicProducts: builder.query({
      query: () => 'shop/public',
    }),
    // Admin Product Management
    getAllProducts: builder.query({
      query: (params) => {
        const cleaned = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
        const qs = new URLSearchParams(cleaned as any).toString();
        return `shop?${qs}`;
      },
      providesTags: ['Packages'], // Using Packages tag for now or should add 'Products' tag
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: 'shop',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Packages'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `shop/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Packages'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `shop/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Packages'],
    }),
    restockProduct: builder.mutation({
      query: ({ id, quantity }) => ({
        url: `shop/${id}/restock`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Packages'],
    }),

    // Wishlist
    getWishlist: builder.query({
      query: () => 'shop/wishlist',
      providesTags: ['Wishlist'],
    }),
    addToWishlist: builder.mutation({
      query: (id) => ({
        url: `shop/wishlist/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Wishlist'],
    }),
    removeFromWishlist: builder.mutation({
      query: (id) => ({
        url: `shop/wishlist/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),

    createOrder: builder.mutation({

      query: (body) => ({
        url: 'orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet', 'Tree'], // PV updates result in wallet/tree changes
    }),
    getMyOrders: builder.query({
      query: () => 'orders/my-orders',
    }),
    getAllOrders: builder.query({
      query: (params) => {
        const cleaned = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
        const qs = new URLSearchParams(cleaned as any).toString();
        return `orders/admin/all?${qs}`;
      },
      providesTags: ['Admin']
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `orders/admin/${id}/status`,
        method: 'PUT',
        body: { status }
      }),
      invalidatesTags: ['Admin', 'Wallet', 'Tree']
    }),
  }),
});

export const {
  useGetTreeQuery,
  useLoginMutation,
  useRegisterMutation,
  useGetUplineQuery,
  useGetMemberDetailsQuery,
  useGetWalletQuery,
  useRequestWithdrawalMutation,
  useUpdateProfileMutation,
  useRunCommissionsMutation,
  useGetSystemLogsQuery,
  useGetAdminCommissionsQuery,
  useGetAdminStatsQuery,
  useGetConfigQuery,
  useUpdateConfigMutation,
  useGetHoldingTankQuery,
  usePlaceMemberMutation,
  useLazySearchDownlineQuery,
  useGetPackagesQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
  useGetEarningsAnalyticsQuery,
  useGetGrowthAnalyticsQuery,
  useGetTicketsQuery,
  useGetAllTicketsQuery,
  useCreateTicketMutation,
  useReplyTicketMutation,
  useUpdateTicketStatusMutation,
  useGetPendingWithdrawalsQuery,
  useProcessWithdrawalMutation,
  useUploadKYCMutation,
  useGetPendingKYCQuery,
  useUpdateKYCStatusMutation,
  useGenerate2FAMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useSeedNotificationsMutation,
  useGetShopStatusQuery,

  useGetShopProductsQuery,
  useGetPublicProductsQuery,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetSettingsQuery,
  useGetPublicSettingsQuery,
  useUpdateSettingMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserStatusMutation,
  useGetAllProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRestockProductMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation
} = api;
