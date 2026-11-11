import type { TransactionData, TokenAmountOutput } from '@helium/blockchain-api'
import { useQueryClient } from '@tanstack/react-query'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { signTransactionData } from '../utils/transactionUtils'
import { MessagePreview } from '../solana/MessagePreview'
import {
  describePageFailure,
  pollForCompletion,
  submitPages,
} from '../utils/batchSubmit'

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
  const { t } = useTranslation()

  const submit = useCallback(
    async (
      response: SubmittableResponse,
      options: GovernanceSubmitOptions,
      fetchMore?: () => Promise<SubmittableResponse>,
    ): Promise<{ signatures: string[] }> => {
      if (!anchorProvider || !walletSignBottomSheetRef) {
        throw new Error('Wallet not connected')
      }

      const { signatures } = await submitPages(response, {
        signPage: async ({ transactionData }) => {
          const decision = await walletSignBottomSheetRef.show({
            type: WalletStandardMessageTypes.signTransaction,
            url: '',
            header: options.header,
            renderer: () =>
              React.createElement(MessagePreview, {
                message: options.message,
              }),
            serializedTxs: transactionData.transactions.map(
              ({ serializedTransaction }) =>
                Buffer.from(serializedTransaction, 'base64'),
            ),
          })

          if (!decision) {
            throw new Error('User rejected transaction')
          }

          return signTransactionData(anchorProvider.wallet, transactionData)
        },
        submitBatch: async (signed) => {
          const { batchId } = await client.transactions.submit({
            ...signed,
            tag: options.tag || 'governance',
          })
          queryClient.invalidateQueries({
            queryKey: ['pendingTransactions'],
          })
          return batchId
        },
        pollBatch: (batchId) => pollForCompletion(client, batchId),
        nextPage: fetchMore,
        waitForLastPage: true,
        describeFailure: (info) => describePageFailure(t, info),
      })

      return { signatures }
    },
    [anchorProvider, walletSignBottomSheetRef, client, queryClient, t],
  )

  return { submit }
}
