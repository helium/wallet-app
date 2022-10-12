// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { SolanaStatusResponse } from './solanaStatusTypes'

// Define a service using a base URL and expected endpoints
export const solanaStatusApi = createApi({
  reducerPath: 'solanaStatusApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://solana-status.helium.com/' }),
  endpoints: (builder) => ({
    getSolanaStatus: builder.query<SolanaStatusResponse, void>({
      query: () => '',
    }),
  }),
})

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const { useGetSolanaStatusQuery, reducer } = solanaStatusApi
