import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Cluster } from '@solana/web3.js'
import Config from 'react-native-config'

type Notification = {
  actionTitle?: string
  actionUrl?: string
  body: string
  icon: string
  id: number
  resource: string
  time: string
  title: string
  type: string
  viewedAt?: string
}

const walletRestApi = createApi({
  reducerPath: 'walletRestApi',
  tagTypes: ['Notifications'],
  baseQuery: fetchBaseQuery({
    baseUrl: Config.WALLET_REST_URI,
  }),
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], string | undefined>({
      query: () => '/notifications',
      providesTags: ['Notifications'],
      transformResponse: (response) => response as Notification[],
    }),
    postPayment: builder.mutation<
      { txnSignature: string; cluster: Cluster },
      { txnSignature: string; cluster: Cluster }
    >({
      query: ({ txnSignature, cluster }) => ({
        url: `/payment?cluster=${cluster}`,
        method: 'POST',
        body: { signature: txnSignature },
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
})

export const { useGetNotificationsQuery, usePostPaymentMutation } =
  walletRestApi
export default walletRestApi
