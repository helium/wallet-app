import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import Config from 'react-native-config'
import { lang } from '../../utils/i18n'
import { AuthState } from './authSlice'

export type BetaAccess = {
  publicKeys: string[]
}

export type TokenPrices = {
  solana: { [key: string]: number }
  helium: { [key: string]: number }
  'helium-mobile': { [key: string]: number }
  'helium-iot': { [key: string]: number }
}

export type RecommendedDapps = {
  devnet: string[]
  testnet: string[]
  'mainnet-beta': string[]
}

export type SessionKey = {
  sessionKey: string
}

/// //////////////////////////////////////////////////////////////////////////////////////
/// // DO NOT ADD TO THIS FILE.
/// // We are working toward removing it entirely. The `createApi` function is buggy with
/// // redux-persist, we need better control. Favor use of src/utils/walletApi.ts and
/// // store data in a relevant redux slice.
/// //////////////////////////////////////////////////////////////////////////////////////

export const walletRestApi = createApi({
  reducerPath: 'walletRestApi',
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
    getRecommendedDapps: builder.query<RecommendedDapps, void>({
      query: () => '/recommendedDapps',
    }),
    getSessionKey: builder.query<SessionKey, void>({
      query: () => '/sessionKey',
    }),
  }),
})

export const {
  useGetRecommendedDappsQuery,
  useLazyGetRecommendedDappsQuery,
  useGetSessionKeyQuery,
  useLazyGetSessionKeyQuery,
  reducer,
} = walletRestApi

export default walletRestApi
