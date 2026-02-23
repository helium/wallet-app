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

export function useTransactionBatchStatus(batchId: string | null) {
  const client = useBlockchainApi()

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['transactionBatch', batchId],
    queryFn: () =>
      client.transactions.get({ id: batchId!, commitment: 'confirmed' }),
    enabled: !!batchId,
    refetchInterval: ({ state }) => {
      const { status } = state.data ?? {}
      if (status && TERMINAL_STATUSES.includes(status as BatchStatus)) {
        return false
      }
      return 2000
    },
  })

  const { status, transactions } = data ?? {}

  return {
    status: status as BatchStatus | undefined,
    signatures: transactions?.map((t) => t.signature) ?? [],
    error,
    isLoading,
    refetch,
  }
}
