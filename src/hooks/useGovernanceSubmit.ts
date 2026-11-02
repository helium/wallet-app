import type { TransactionData, TokenAmountOutput } from '@helium/blockchain-api'
import { useQueryClient } from '@tanstack/react-query'
import React, { useCallback } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { submitSigned } from '../utils/submitSigned'
import { signTransactionData } from '../utils/transactionUtils'
import { MessagePreview } from '../solana/MessagePreview'
import { pollForCompletion } from './useSubmitAndAwait'

type SubmittableResponse = {
  transactionData: TransactionData
  estimatedSolFee?: TokenAmountOutput
  hasMore?: boolean
}

export interface GovernanceSubmitOptions {
  header: string
  message: string
  tag?: string
}

export function useGovernanceSubmit(): {
  submit: (
    response: SubmittableResponse,
    options: GovernanceSubmitOptions,
    fetchMore?: () => Promise<SubmittableResponse>,
  ) => Promise<{ signatures: string[] }>
} {
  const { anchorProvider } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const client = useBlockchainApi()
  const queryClient = useQueryClient()

  const submit = useCallback(
    async (
      response: SubmittableResponse,
      options: GovernanceSubmitOptions,
      fetchMore?: () => Promise<SubmittableResponse>,
    ): Promise<{ signatures: string[] }> => {
      if (!anchorProvider || !walletSignBottomSheetRef) {
        throw new Error('Wallet not connected')
      }

      const allSignatures: string[] = []
      let current = response

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

        const { batchId } = await submitSigned(client, taggedData)
        void queryClient.invalidateQueries({
          queryKey: ['pendingTransactions'],
        })

        const { status, signatures } = await pollForCompletion(client, batchId)

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
    },
    [anchorProvider, walletSignBottomSheetRef, client, queryClient],
  )

  return { submit }
}
