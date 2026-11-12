import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import {
  createBatchView,
  mergeBatchStatuses,
  type BatchStatus,
} from '../utils/batchSubmit'

export { type BatchStatus }

export function useTransactionBatchesStatus(batchIds: string[] | null) {
  const client = useBlockchainApi()
  const ids = batchIds ?? []
  // One settle rule per batch, kept across polls.
  const views = useRef(new Map<string, ReturnType<typeof createBatchView>>())

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['transactionBatches', ids],
    queryFn: () =>
      Promise.all(
        ids.map(async (id) => {
          const view = views.current.get(id) ?? createBatchView()
          views.current.set(id, view)
          return view(
            await client.transactions.get({ id, commitment: 'confirmed' }),
          )
        }),
      ),
    enabled: ids.length > 0,
    refetchInterval: ({ state }) => {
      const batches = state.data
      if (batches && batches.every((batch) => batch.status !== 'pending')) {
        return false
      }
      return 2000
    },
  })

  const status = data
    ? mergeBatchStatuses(data.map((batch) => batch.status as BatchStatus))
    : undefined

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
