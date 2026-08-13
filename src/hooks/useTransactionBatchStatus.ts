import { useQuery } from '@tanstack/react-query'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'

export type BatchStatus =
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'expired'
  | 'partial'

export const TERMINAL_STATUSES: BatchStatus[] = [
  'confirmed',
  'failed',
  'expired',
  'partial',
]

export function useTransactionBatchesStatus(batchIds: string[] | null) {
  const client = useBlockchainApi()
  const ids = batchIds ?? []

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['transactionBatches', ids],
    queryFn: () =>
      Promise.all(
        ids.map((id) =>
          client.transactions.get({ id, commitment: 'confirmed' }),
        ),
      ),
    enabled: ids.length > 0,
    refetchInterval: ({ state }) => {
      const batches = state.data
      if (
        batches &&
        batches.every((batch) =>
          TERMINAL_STATUSES.includes(batch.status as BatchStatus),
        )
      ) {
        return false
      }
      return 2000
    },
  })

  const statuses = (data ?? []).map((batch) => batch.status as BatchStatus)
  const [firstStatus] = statuses
  let status: BatchStatus | undefined
  if (data) {
    if (statuses.some((s) => !TERMINAL_STATUSES.includes(s))) {
      status = 'pending'
    } else if (statuses.every((s) => s === firstStatus)) {
      status = firstStatus
    } else {
      status = 'partial'
    }
  }

  return {
    status,
    signatures:
      data?.flatMap(
        (batch) => batch.transactions?.map((t) => t.signature) ?? [],
      ) ?? [],
    error,
    isLoading,
    refetch,
  }
}

export function useTransactionBatchStatus(batchId: string | null) {
  return useTransactionBatchesStatus(batchId ? [batchId] : null)
}
