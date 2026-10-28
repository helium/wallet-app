import { QueryClient } from '@tanstack/react-query'

// Focus and reconnect refetch every stale query; without a default staleTime
// the same RPC read can fire twice in a row.
export const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
