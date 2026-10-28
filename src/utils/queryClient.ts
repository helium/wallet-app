import { QueryClient } from '@tanstack/react-query'

// Query key roots whose data is saved to disk and shown at startup
export const PERSISTED_QUERY_ROOTS = ['collectables', 'hotspots'] as const
export type PersistedQueryRoot = (typeof PERSISTED_QUERY_ROOTS)[number]

export const PERSISTED_QUERY_MAX_AGE = 7 * 24 * 60 * 60 * 1000

// Every mount and query-key change refetches a stale query; without a default
// staleTime the same RPC read can fire twice in a row.
export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  })
  // A persisted query must stay in memory as long as it stays on disk, or
  // garbage collection drops it from the next save
  PERSISTED_QUERY_ROOTS.forEach((root) =>
    queryClient.setQueryDefaults([root], { gcTime: PERSISTED_QUERY_MAX_AGE }),
  )
  return queryClient
}

export const queryClient = createQueryClient()
