import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TransactionData } from '@helium/blockchain-api'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { useSolana } from '../solana/SolanaProvider'
import { signTransactionData } from '../utils/transactionUtils'

interface SubmitTransactionParams {
  transactionData: TransactionData
  onNeedsResign?: () => Promise<TransactionData>
}

export function useSubmitTransaction() {
  const queryClient = useQueryClient()
  const { anchorProvider } = useSolana()
  const client = useBlockchainApi()

  const { mutateAsync, isPending, error, data, reset } = useMutation({
    mutationFn: async ({
      transactionData,
      onNeedsResign: _onNeedsResign,
    }: SubmitTransactionParams) => {
      if (!anchorProvider) {
        throw new Error('Wallet not connected')
      }

      // Sign transactions
      const signed = await signTransactionData(
        anchorProvider.wallet,
        transactionData,
      )

      // Submit to API
      const { batchId } = await client.transactions.submit(signed)

      // Invalidate getByPayer so global widget updates
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })

      return batchId
    },
    // TODO: Handle blockhash expiration via onError + retry with onNeedsResign
  })

  return {
    submit: mutateAsync,
    isPending,
    error,
    batchId: data,
    reset,
  }
}
