import { useQuery } from '@tanstack/react-query'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'

export type BatchStatus =
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'expired'
  | 'partial'

export function useTransactionBatchStatus(batchId: string | null) {
  const client = useBlockchainApi()

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['transactionBatch', batchId],
    queryFn: () =>
      client.transactions.get({ id: batchId!, commitment: 'confirmed' }),
    enabled: !!batchId,
    refetchInterval: ({ state }) => {
      // Stop polling when terminal state reached
      const { status } = state.data ?? {}
      if (
        status === 'confirmed' ||
        status === 'failed' ||
        status === 'expired' ||
        status === 'partial'
      ) {
        return false
      }
      return 2000 // Poll every 2s while pending
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
