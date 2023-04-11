import { Ticker } from '@helium/currency'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Cluster } from '@solana/web3.js'
import Config from 'react-native-config'
import { AccountBalance } from '../../types/accountBalance'
import { lang } from '../../utils/i18n'
import { AuthState } from './authSlice'

export type BetaAccess = {
  publicKeys: string[]
}

export type Mints = Record<Ticker, string>

type Notification = {
  title: string | null
  body: string | null
  id: number | null
  createdAt: Date | null
  updatedAt: Date | null
  viewedAt: Date | null
  identifier: string | null
  icon: string | null
  resource: string | null
  type: string | null
  deliveryTimeOfDay: string | null
  actionTitle: string | null
  actionUrl: string | null
  uuid: string | null
  time: string
}

export type TokenPrices = {
  solana: { [key: string]: number }
  helium: { [key: string]: number }
}

export type RecommendedDapps = {
  devnet: string[]
  testnet: string[]
  'mainnet-beta': string[]
}

export type SessionKey = {
  sessionKey: string
}

export const walletRestApi = createApi({
  reducerPath: 'walletRestApi',
  tagTypes: ['Notifications'],
  baseQuery: fetchBaseQuery({
    baseUrl: Config.WALLET_REST_URI,
    prepareHeaders: (headers, { getState }) => {
      const { auth } = getState() as {
        auth: AuthState
      }

      if (auth.apiToken) {
        headers.set('authorization', `Bearer ${auth.apiToken}`)
      }

      headers.set('accept-language', lang)
      return headers
    },
  }),
  endpoints: (builder) => ({
    getBetaPubkeys: builder.query<BetaAccess, void>({
      query: () => '/betaAccess',
    }),
    getMints: builder.query<Mints, string>({
      query: (cluster) => `/mints?cluster=${cluster}`,
    }),
    getBalanceHistory: builder.query<
      AccountBalance[],
      { currency: string; address: string; cluster: Cluster }
    >({
      query: ({ address, currency, cluster }) =>
        `/balances/${address}?cluster=${cluster}&currency=${currency.toLowerCase()}`,
    }),
    getNotifications: builder.query<Notification[], string | undefined>({
      query: (resource) => `/notifications/${resource}`,
      providesTags: ['Notifications'],
      transformResponse: (response) => {
        return response as Notification[]
      },
    }),
    postNotificationRead: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: '/notifications/markRead',
        method: 'PUT',
        body: { id },
      }),
      invalidatesTags: ['Notifications'],
    }),
    postPayment: builder.mutation<
      void,
      { txnSignature: string; cluster: Cluster }
    >({
      query: ({ txnSignature, cluster }) => ({
        url: `/payments?cluster=${cluster}`,
        method: 'POST',
        body: { signature: txnSignature },
      }),
      invalidatesTags: ['Notifications'],
    }),
    getTokenPrices: builder.query<
      TokenPrices,
      { tokens: string; currency: string }
    >({
      query: ({ tokens, currency }) =>
        `/prices/fetchTokenPrices?tokens=${tokens}&currency=${currency}`,
      transformResponse: (response) => {
        return response as TokenPrices
      },
      serializeQueryArgs: ({
        endpointName,
        queryArgs: { currency, tokens },
      }) => {
        return {
          currency,
          tokens,
          endpointName,
        }
      },
      merge: (_, newItems) => {
        return newItems
      },
      // Refetch when the page arg changes
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg
      },
      keepUnusedDataFor: 60,
    }),
    getRecommendedDapps: builder.query<RecommendedDapps, void>({
      query: () => '/recommendedDapps',
    }),
    getSessionKey: builder.query<SessionKey, void>({
      query: () => '/sessionKey',
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  usePostPaymentMutation,
  usePostNotificationReadMutation,
  useLazyGetMintsQuery,
  useGetMintsQuery,
  useGetBetaPubkeysQuery,
  useGetBalanceHistoryQuery,
  useGetTokenPricesQuery,
  useLazyGetTokenPricesQuery,
  useGetRecommendedDappsQuery,
  useLazyGetRecommendedDappsQuery,
  useGetSessionKeyQuery,
  useLazyGetSessionKeyQuery,
  reducer,
} = walletRestApi

export default walletRestApi
