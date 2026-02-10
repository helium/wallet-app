import type { GovernanceTransactionResponse } from '@helium/blockchain-api'
import { useQueryClient } from '@tanstack/react-query'
import React, { useCallback, useState } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { signTransactionData } from '../utils/transactionUtils'
import { MessagePreview } from '../solana/MessagePreview'
import type { BatchStatus } from './useTransactionBatchStatus'

export interface GovernanceSubmitOptions {
  header: string
  message: string
  tag?: string
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

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error('Transaction polling timeout')
}

export function useGovernanceSubmit(): {
  submit: (
    response: GovernanceTransactionResponse,
    options: GovernanceSubmitOptions,
    fetchMore?: () => Promise<GovernanceTransactionResponse>,
  ) => Promise<{ signatures: string[] }>
  isPending: boolean
  error: Error | null
  reset: () => void
} {
  const { anchorProvider } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const client = useBlockchainApi()
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const reset = useCallback(() => {
    setError(null)
    setIsPending(false)
  }, [])

  const submit = useCallback(
    async (
      response: GovernanceTransactionResponse,
      options: GovernanceSubmitOptions,
      fetchMore?: () => Promise<GovernanceTransactionResponse>,
    ): Promise<{ signatures: string[] }> => {
      if (!anchorProvider || !walletSignBottomSheetRef) {
        throw new Error('Wallet not connected')
      }

      setIsPending(true)
      setError(null)
      const allSignatures: string[] = []

      try {
        let current = response

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { transactionData } = current

          if (transactionData.transactions.length === 0) {
            break
          }

          const serializedTxs = transactionData.transactions.map(
            ({ serializedTransaction }) =>
              Buffer.from(serializedTransaction, 'base64'),
          )

          const decision = await walletSignBottomSheetRef.show({
            type: WalletStandardMessageTypes.signTransaction,
            url: '',
            header: options.header,
            renderer: () =>
              React.createElement(MessagePreview, {
                message: options.message,
              }),
            serializedTxs,
          })

          if (!decision) {
            throw new Error('User rejected transaction')
          }

          const signed = await signTransactionData(
            anchorProvider.wallet,
            transactionData,
          )

          const tag = options.tag || 'governance'
          const taggedData = { ...signed, tag }

          const { batchId } = await client.transactions.submit(taggedData)
          queryClient.invalidateQueries({
            queryKey: ['pendingTransactions'],
          })

          const { status, signatures } = await pollForCompletion(
            client,
            batchId,
          )

          if (status === 'failed' || status === 'partial') {
            throw new Error('Transaction failed')
          }

          if (status === 'expired') {
            throw new Error('Transaction expired')
          }

          allSignatures.push(...signatures)

          if (!current.hasMore || !fetchMore) {
            break
          }

          current = await fetchMore()
        }

        return { signatures: allSignatures }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        setError(err)
        throw err
      } finally {
        setIsPending(false)
      }
    },
    [anchorProvider, walletSignBottomSheetRef, client, queryClient],
  )

  return { submit, isPending, error, reset }
}
