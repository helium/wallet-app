import { Ticker } from '@helium/currency'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Cluster } from '@solana/web3.js'
import Config from 'react-native-config'
import { lang } from '../../utils/i18n'

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

export const walletRestApi = createApi({
  reducerPath: 'walletRestApi',
  tagTypes: ['Notifications'],
  baseQuery: fetchBaseQuery({
    baseUrl: Config.WALLET_REST_URI,
    prepareHeaders: (headers) => {
      headers.set('accept-language', lang)
      return headers
    },
  }),
  endpoints: (builder) => ({
    getMints: builder.query<Mints, string>({
      query: (cluster) => `/mints?cluster=${cluster}`,
    }),
    getNotifications: builder.query<Notification[], string | undefined>({
      query: (resource) => `/notifications/${resource}`,
      providesTags: ['Notifications'],
      transformResponse: (response) => {
        return response as Notification[]
      },
    }),
    postPayment: builder.mutation<
      { txnSignature: string; cluster: Cluster },
      { txnSignature: string; cluster: Cluster }
    >({
      query: ({ txnSignature, cluster }) => ({
        url: `/payments?cluster=${cluster}`,
        method: 'POST',
        body: { signature: txnSignature },
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  usePostPaymentMutation,
  useLazyGetMintsQuery,
  useGetMintsQuery,
  reducer,
} = walletRestApi
