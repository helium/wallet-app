// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type SolanaStatusResponse = {
  migrationStatus: 'not_started' | 'in_progress' | 'complete'
  minimumVersions: Record<string, string>
  treasuryWarning: boolean
  finalBlockHeight?: number
}

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

export const parseSolanaStatus = (status?: SolanaStatusResponse) => {
  if (!status?.migrationStatus) {
    return {
      migrationStatus: 'complete',
      minimumVersions: {
        'com.helium.wallet.app': '2.0.0',
      } as Record<string, string>,
      treasuryWarning: true,
    }
  }
  return status
}

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const { useGetSolanaStatusQuery, reducer } = solanaStatusApi
