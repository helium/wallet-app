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
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '../utils/constants'
import type { BatchStatus } from './useTransactionBatchStatus'

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
  batchTransactions?: boolean // If true, batch transactions to prevent blockhash expiration
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
      batchTransactions = false,
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

      // Get finalized blockhash for all transactions
      const { blockhash } = await anchorProvider.connection.getLatestBlockhash(
        'finalized',
      )

      const populatedDrafts = await Promise.all(
        transactions.map((tx) =>
          populateMissingDraftInfo(anchorProvider.connection, {
            ...tx,
            recentBlockhash: blockhash,
          }),
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

      // If batching is enabled and we have more transactions than the batch size, batch them
      if (
        batchTransactions &&
        asVersionedTx.length > MAX_TRANSACTIONS_PER_SIGNATURE_BATCH
      ) {
        const chunkCount = Math.ceil(
          asVersionedTx.length / MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
        )
        const batchPromises = Array.from(
          { length: chunkCount },
          async (_, index) => {
            const start = index * MAX_TRANSACTIONS_PER_SIGNATURE_BATCH
            const chunk = asVersionedTx.slice(
              start,
              start + MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
            )
            const chunkDrafts = transactions.slice(
              start,
              start + MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
            )

            // Sign chunk
            const signedChunk = await anchorProvider.wallet.signAllTransactions(
              chunk,
            )

            // Apply additional keypair signers if needed
            signedChunk.forEach((tx, j) => {
              const draft = chunkDrafts[j]
              sigs.forEach((sig) => {
                if (
                  draft.signers?.some((s) => s.publicKey.equals(sig.publicKey))
                ) {
                  tx.sign([sig])
                }
              })
            })

            // Convert to TransactionData format and submit
            const txnData = toTransactionData(signedChunk, {
              parallel: !sequentially,
              tag,
              metadata: {
                type: tag,
                description: message,
              },
            })

            const { batchId } = await client.transactions.submit(txnData)
            queryClient.invalidateQueries({
              queryKey: ['pendingTransactions'],
            })

            // Poll for completion
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

            return { batchId, signatures }
          },
        )

        const results = await Promise.all(batchPromises)
        return results[results.length - 1]
      }

      // Sign all transactions (no batching)
      const signedTxns = await anchorProvider.wallet.signAllTransactions(
        asVersionedTx,
      )

      // Apply additional keypair signers if needed (e.g., for new position keypairs)
      signedTxns.forEach((tx, i) => {
        const draft = transactions[i]
        sigs.forEach((sig) => {
          if (draft.signers?.some((s) => s.publicKey.equals(sig.publicKey))) {
            tx.sign([sig])
          }
        })
      })

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

      // Poll for completion
      const { status, signatures } = await pollForCompletion(client, batchId)

      if (status === 'failed' || status === 'partial') {
        throw new Error('Transaction failed')
      }

      if (status === 'expired') {
        throw new Error('Transaction expired')
      }

      return { batchId, signatures }
    },
  })

  return {
    execute: mutateAsync,
    isPending,
    error,
    reset,
  }
}
