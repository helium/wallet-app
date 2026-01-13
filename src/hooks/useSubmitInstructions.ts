import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  batchInstructionsToTxsWithPriorityFee,
  HELIUM_COMMON_LUT,
  HELIUM_COMMON_LUT_DEVNET,
  populateMissingDraftInfo,
  Status,
  toVersionedTx,
} from '@helium/spl-utils'
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js'
import React from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { toTransactionData } from '../utils/transactionUtils'
import { getBasePriorityFee } from '../utils/walletApiV2'
import { MessagePreview } from '../solana/MessagePreview'

interface SubmitInstructionsParams {
  header: string
  message: string
  instructions: TransactionInstruction[] | TransactionInstruction[][]
  sigs?: Keypair[]
  sequentially?: boolean
  tag?: string
  computeScaleUp?: number
  maxInstructionsPerTx?: number
  useFirstEstimateForAll?: boolean
  addressLookupTableAddresses?: PublicKey[]
  onProgress?: (status: Status) => void
}

export function useSubmitInstructions() {
  const { anchorProvider, cluster } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const client = useBlockchainApi()
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, error, reset } = useMutation({
    mutationFn: async ({
      header,
      message,
      instructions,
      sigs = [],
      sequentially = false,
      tag = 'transaction',
      computeScaleUp,
      maxInstructionsPerTx,
      useFirstEstimateForAll,
      addressLookupTableAddresses,
    }: SubmitInstructionsParams) => {
      if (!anchorProvider || !walletSignBottomSheetRef) {
        throw new Error('Wallet not connected')
      }

      const defaultLut =
        cluster === 'devnet' ? HELIUM_COMMON_LUT_DEVNET : HELIUM_COMMON_LUT

      const transactions = await batchInstructionsToTxsWithPriorityFee(
        anchorProvider,
        instructions,
        {
          basePriorityFee: await getBasePriorityFee(),
          computeScaleUp,
          maxInstructionsPerTx,
          useFirstEstimateForAll,
          addressLookupTableAddresses: addressLookupTableAddresses || [
            defaultLut,
          ],
          extraSigners: sigs,
        },
      )

      const populatedDrafts = await Promise.all(
        transactions.map((tx) =>
          populateMissingDraftInfo(anchorProvider.connection, tx),
        ),
      )

      const asVersionedTx = populatedDrafts.map(toVersionedTx)

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header,
        renderer: () => React.createElement(MessagePreview, { message }),
        suppressWarnings: sequentially,
        serializedTxs: asVersionedTx.map((transaction) =>
          Buffer.from(transaction.serialize()),
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign all transactions
      const signedTxns = await anchorProvider.wallet.signAllTransactions(
        asVersionedTx,
      )

      // Apply additional keypair signers if needed (e.g., for new position keypairs)
      for (let i = 0; i < signedTxns.length; i += 1) {
        const tx = signedTxns[i]
        const draft = transactions[i]
        for (const sig of sigs) {
          if (draft.signers?.some((s) => s.publicKey.equals(sig.publicKey))) {
            tx.sign([sig])
          }
        }
      }

      // Convert to TransactionData format
      const txnData = toTransactionData(signedTxns, {
        parallel: !sequentially,
        tag,
        metadata: {
          type: tag,
          description: message,
        },
      })

      // Submit via API
      const { batchId } = await client.transactions.submit(txnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  return {
    execute: mutateAsync,
    isPending,
    error,
    reset,
  }
}

