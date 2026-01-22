import { useQuery } from '@tanstack/react-query'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { useCurrentWallet } from './useCurrentWallet'

export function usePendingTransactions() {
  const client = useBlockchainApi()
  const wallet = useCurrentWallet()

  const { data, isLoading, error } = useQuery({
    queryKey: ['pendingTransactions', wallet?.toBase58()],
    queryFn: () =>
      client.transactions.getByPayer({ payer: wallet!.toBase58() }),
    enabled: !!wallet,
    refetchInterval: 5000, // Poll every 5s
    select: (response) =>
      response.batches.filter((batch) => batch.status === 'pending'),
  })

  return {
    pendingTransactions: data ?? [],
    pendingCount: data?.length ?? 0,
    isLoading,
    error,
  }
}
