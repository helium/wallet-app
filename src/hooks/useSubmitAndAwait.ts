import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TransactionData } from '@helium/blockchain-api'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { useSolana } from '../solana/SolanaProvider'
import { signTransactionData } from '../utils/transactionUtils'
import type { BatchStatus } from './useTransactionBatchStatus'

interface SubmitAndAwaitParams {
  transactionData: TransactionData
  /**
   * Called when blockhash expires and transaction needs to be rebuilt and re-signed.
   * Should return fresh transaction data with new blockhash.
   */
  onNeedsResign?: () => Promise<TransactionData>
  /**
   * Max number of retry attempts on blockhash expiration (default: 3)
   */
  maxRetries?: number
}

async function pollForCompletion(
  client: ReturnType<typeof useBlockchainApi>,
  batchId: string,
  pollIntervalMs = 2000,
  maxPollTime = 60000,
): Promise<{ status: BatchStatus; signatures: string[] }> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxPollTime) {
    const result = await client.transactions.get({
      id: batchId,
      commitment: 'confirmed',
    })

    const status = result.status as BatchStatus

    if (
      status === 'confirmed' ||
      status === 'failed' ||
      status === 'expired' ||
      status === 'partial'
    ) {
      return {
        status,
        signatures: result.transactions?.map((t) => t.signature) ?? [],
      }
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error('Transaction polling timeout')
}

/**
 * Hook that submits a transaction and waits for it to complete.
 * Handles blockhash expiration with automatic retry if onNeedsResign is provided.
 *
 * Returns when the transaction is confirmed, or throws on failure.
 */
export function useSubmitAndAwait() {
  const queryClient = useQueryClient()
  const { anchorProvider } = useSolana()
  const client = useBlockchainApi()

  const { mutateAsync, isPending, error, data, reset } = useMutation({
    mutationFn: async ({
      transactionData,
      onNeedsResign,
      maxRetries = 3,
    }: SubmitAndAwaitParams): Promise<{ signatures: string[] }> => {
      if (!anchorProvider) {
        throw new Error('Wallet not connected')
      }

      let currentTxData = transactionData

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        // Sign transactions
        const signed = await signTransactionData(
          anchorProvider.wallet,
          currentTxData,
        )

        // Submit to API
        const { batchId } = await client.transactions.submit(signed)

        // Invalidate pending transactions query so global widget updates
        queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })

        // Poll for completion
        const { status, signatures } = await pollForCompletion(client, batchId)

        if (status === 'confirmed') {
          return { signatures }
        }

        if (status === 'failed' || status === 'partial') {
          throw new Error('Transaction failed')
        }

        if (status === 'expired') {
          if (!onNeedsResign) {
            throw new Error('Transaction expired and no retry handler provided')
          }
          if (attempt === maxRetries) {
            throw new Error('Max retries exceeded for expired transaction')
          }
          // Get fresh transaction data with new blockhash for next attempt
          currentTxData = await onNeedsResign()
        }
      }

      throw new Error('Unexpected end of retry loop')
    },
  })

  return {
    submitAndAwait: mutateAsync,
    isPending,
    error,
    signatures: data?.signatures,
    reset,
  }
}
