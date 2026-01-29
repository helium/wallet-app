import type { AnchorProvider, Program } from '@coral-xyz/anchor'
import * as distributorOracle from '@helium/distributor-oracle'
import {
  decodeEntityKey,
  init as initHem,
  keyToAssetForAsset,
} from '@helium/helium-entity-manager-sdk'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { init as initLazyDistributor } from '@helium/lazy-distributor-sdk'
import { NetworkType } from '@helium/onboarding'
import { useOnboarding } from '@helium/react-native-sdk'
import {
  DC_MINT,
  populateMissingDraftInfo,
  toVersionedTx,
} from '@helium/spl-utils'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WrappedConnection } from '@utils/WrappedConnection'
import { ellipsizeAddress } from '@utils/accountUtils'
import {
  DAO_KEY,
  HNT_LAZY_KEY,
  IOT_LAZY_KEY,
  MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
  Mints,
  MOBILE_LAZY_KEY,
} from '@utils/constants'
import { humanReadable } from '@utils/formatting'
import i18n from '@utils/i18n'
import * as solUtils from '@utils/solanaUtils'
import { getCachedKeyToAssets, toAsset } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useCallback } from 'react'
import { CollectablePreview } from '../solana/CollectablePreview'
import { MessagePreview } from '../solana/MessagePreview'
import { PaymentPreivew } from '../solana/PaymentPreview'
import { useSolana } from '../solana/SolanaProvider'
import { SwapPreview } from '../solana/SwapPreview'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import {
  Collectable,
  CompressedNFT,
  HotspotWithPendingRewards,
} from '../types/solana'
import {
  hashTagParams,
  signTransactionData,
  toTransactionData,
} from '../utils/transactionUtils'

// Helper to get entityKey from a CompressedNFT
async function getEntityKeyFromCompressedNFT(
  anchorProvider: AnchorProvider,
  compressedNFT: CompressedNFT,
): Promise<string> {
  const hemProgram = (await initHem(
    anchorProvider,
  )) as unknown as Program<HeliumEntityManager>

  const asset = toAsset(compressedNFT)
  const keyToAssetKey = keyToAssetForAsset(asset, DAO_KEY)
  const kta = await hemProgram.account.keyToAssetV0.fetch(keyToAssetKey)
  const entityKey = decodeEntityKey(kta.entityKey, kta.keySerialization)

  if (!entityKey) {
    throw new Error('Failed to decode entity key')
  }

  return entityKey
}

// Helper to batch and submit transactions in chunks to prevent blockhash expiration
async function batchAndSubmitTransactions(
  anchorProvider: AnchorProvider,
  client: ReturnType<typeof useBlockchainApi>,
  queryClient: ReturnType<typeof useQueryClient>,
  transactions: VersionedTransaction[],
  tag: string,
  metadata: { type: string; description: string },
): Promise<string> {
  if (transactions.length === 0) {
    throw new Error('No transactions to submit')
  }

  // If we have fewer transactions than the batch size, submit all at once
  if (transactions.length <= MAX_TRANSACTIONS_PER_SIGNATURE_BATCH) {
    const signedTxns = await anchorProvider.wallet.signAllTransactions(
      transactions,
    )
    const txnData = toTransactionData(signedTxns, { tag, metadata })
    const { batchId } = await client.transactions.submit(txnData)
    queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
    return batchId
  }

  // Otherwise, batch them
  const chunkCount = Math.ceil(
    transactions.length / MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
  )
  const batchPromises = Array.from({ length: chunkCount }, async (_, index) => {
    const start = index * MAX_TRANSACTIONS_PER_SIGNATURE_BATCH
    const chunk = transactions.slice(
      start,
      start + MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
    )
    const signedTxns = await anchorProvider.wallet.signAllTransactions(chunk)
    const txnData = toTransactionData(signedTxns, { tag, metadata })
    const { batchId } = await client.transactions.submit(txnData)
    queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
    return batchId
  })

  const batchIds = await Promise.all(batchPromises)
  return batchIds[batchIds.length - 1]
}

export default () => {
  const { anchorProvider } = useSolana()
  const { currentAccount } = useAccountStorage()
  const { t } = i18n
  const { walletSignBottomSheetRef } = useWalletSign()
  const { getAssertData } = useOnboarding()
  const client = useBlockchainApi()
  const queryClient = useQueryClient()

  // Payment mutation using API tokens.transfer endpoint
  const paymentMutation = useMutation({
    mutationFn: async ({
      payments,
      mint,
    }: {
      payments: { payee: string; balanceAmount: BN; max?: boolean }[]
      mint: PublicKey
    }) => {
      if (
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        !walletSignBottomSheetRef
      ) {
        throw new Error(t('errors.account'))
      }

      // For each payment, get transaction data from API
      const txnDataPromises = payments.map(async (payment) => {
        // Convert BN amount to decimal string
        const amountStr = payment.balanceAmount.toString()
        const { transactionData } = await client.tokens.transfer({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          walletAddress: currentAccount.solanaAddress!,
          tokenAmount: {
            amount: amountStr,
            mint: mint.toBase58(),
          },
          destination: payment.payee,
        })
        return transactionData
      })

      const txnDataList = await Promise.all(txnDataPromises)

      // Combine all transactions
      const allTxns = txnDataList.flatMap((td) => td.transactions)
      const paymentSummary = payments
        .map((p) => `${p.payee}-${p.balanceAmount.toString()}`)
        .join('_')
      const combinedTxnData = {
        transactions: allTxns,
        parallel: false,
        tag: `payment-${mint.toBase58()}-${paymentSummary}`,
      }

      const serializedTxs = combinedTxnData.transactions.map((tx) =>
        Buffer.from(tx.serializedTransaction, 'base64'),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('transactions.sendTokens'),
        message: t('transactions.signPaymentTxn'),
        serializedTxs,
        renderer: () => <PaymentPreivew {...{ payments, mint }} />,
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign and submit via API
      const signedTxnData = await signTransactionData(
        anchorProvider.wallet,
        combinedTxnData,
      )

      const { batchId } = await client.transactions.submit(signedTxnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  const submitPayment = useCallback(
    async (
      payments: { payee: string; balanceAmount: BN; max?: boolean }[],
      mint: PublicKey,
    ) => {
      return paymentMutation.mutateAsync({ payments, mint })
    },
    [paymentMutation],
  )

  // Collectable transfer mutation - uses API for hotspots, local for regular collectables
  const collectableMutation = useMutation({
    mutationFn: async ({
      collectable,
      payee,
    }: {
      collectable: CompressedNFT | Collectable
      payee: string
    }) => {
      if (
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        !walletSignBottomSheetRef
      ) {
        throw new Error(t('errors.account'))
      }

      const compressedNFT = collectable as CompressedNFT
      const nft = collectable as Collectable
      const isCompressed = compressedNFT?.compression?.compressed

      let txnData

      if (isCompressed) {
        // Use API for hotspot (compressed NFT) transfers
        const entityKey = await getEntityKeyFromCompressedNFT(
          anchorProvider,
          compressedNFT,
        )
        const { transactionData } = await client.hotspots.transferHotspot({
          walletAddress: currentAccount.solanaAddress,
          hotspotPubkey: entityKey,
          recipient: payee,
        })
        txnData = transactionData
      } else {
        // Use local transaction building for regular collectables
        const transferTxn = await solUtils.transferCollectable(
          anchorProvider,
          currentAccount.solanaAddress,
          currentAccount.address,
          nft,
          payee,
        )
        const populatedTxn = await populateMissingDraftInfo(
          anchorProvider.connection,
          {
            ...transferTxn,
            recentBlockhash: (
              await anchorProvider.connection.getLatestBlockhash('finalized')
            ).blockhash,
          },
        )
        const transferParamsHash = hashTagParams({
          nft: nft.id || nft.address,
          payee,
        })
        txnData = toTransactionData([toVersionedTx(populatedTxn)], {
          tag: `collectable-transfer-${transferParamsHash}`,
          metadata: {
            type: 'transfer',
            description: 'Transfer collectable',
          },
        })
      }

      const serializedTxs = txnData.transactions.map((tx) =>
        Buffer.from(tx.serializedTransaction, 'base64'),
      )

      const decision = await walletSignBottomSheetRef.show({
        url: '',
        type: WalletStandardMessageTypes.signTransaction,
        header: t('transactions.transferCollectable'),
        message: t('transactions.signTransferCollectableTxn'),
        serializedTxs,
        renderer: () => <CollectablePreview {...{ collectable, payee }} />,
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign and submit
      const signedTxnData = await signTransactionData(
        anchorProvider.wallet,
        txnData,
      )

      const { batchId } = await client.transactions.submit(signedTxnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  const submitCollectable = useCallback(
    async (collectable: CompressedNFT | Collectable, payee: string) => {
      return collectableMutation.mutateAsync({ collectable, payee })
    },
    [collectableMutation],
  )

  // Jupiter swap mutation
  const jupiterSwapMutation = useMutation({
    mutationFn: async ({
      inputMint,
      inputAmount,
      outputMint,
      outputAmount,
      minReceived,
      swapTxn,
    }: {
      inputMint: PublicKey
      inputAmount: number
      outputMint: PublicKey
      outputAmount: number
      minReceived: number
      swapTxn: VersionedTransaction
    }) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const serializedTx = Buffer.from(swapTxn.serialize())

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('swapsScreen.swapTokens'),
        message: t('transactions.signSwapTxn'),
        serializedTxs: [serializedTx],
        suppressWarnings: true,
        renderer: () => (
          <SwapPreview
            {...{
              inputMint,
              inputAmount,
              outputMint,
              outputAmount,
              minReceived,
            }}
          />
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      const signed = await anchorProvider.wallet.signTransaction(swapTxn)
      const swapParamsHash = hashTagParams({
        inputMint: inputMint.toBase58(),
        inputAmount,
        outputMint: outputMint.toBase58(),
        outputAmount,
      })
      const txnData = toTransactionData([signed], {
        tag: `jupiter-swap-${swapParamsHash}`,
        metadata: { type: 'swap', description: 'Jupiter swap' },
      })

      const { batchId } = await client.transactions.submit(txnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  const submitJupiterSwap = useCallback(
    async (params: {
      inputMint: PublicKey
      inputAmount: number
      outputMint: PublicKey
      outputAmount: number
      minReceived: number
      swapTxn: VersionedTransaction
    }) => {
      return jupiterSwapMutation.mutateAsync(params)
    },
    [jupiterSwapMutation],
  )

  // Treasury swap mutation
  const treasurySwapMutation = useMutation({
    mutationFn: async ({
      fromMint,
      amount,
      recipient,
    }: {
      fromMint: PublicKey
      amount: number
      recipient: PublicKey
    }) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const { connection } = anchorProvider
      const recipientExists = Boolean(
        await connection.getAccountInfo(recipient),
      )

      const swapTxn = await solUtils.createTreasurySwapTxn(
        amount,
        fromMint,
        anchorProvider,
        recipient,
      )

      const { blockhash } = await connection.getLatestBlockhash('finalized')
      const serializedTx = toVersionedTx(
        await populateMissingDraftInfo(connection, {
          ...swapTxn,
          recentBlockhash: blockhash,
        }),
      ).serialize()

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        warning: recipientExists ? '' : t('transactions.recipientNonExistent'),
        header: t('transactions.swapTokens'),
        message: t('transactions.signSwapTxn'),
        serializedTxs: [Buffer.from(serializedTx)],
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      const signed = await anchorProvider.wallet.signTransaction(
        VersionedTransaction.deserialize(serializedTx),
      )

      const treasuryParamsHash = hashTagParams({
        fromMint: fromMint.toBase58(),
        amount,
        recipient: recipient.toBase58(),
      })
      const txnData = toTransactionData([signed], {
        tag: `treasury-swap-${treasuryParamsHash}`,
        metadata: { type: 'swap', description: 'Treasury swap' },
      })

      const { batchId } = await client.transactions.submit(txnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  const submitTreasurySwap = useCallback(
    async (fromMint: PublicKey, amount: number, recipient: PublicKey) => {
      return treasurySwapMutation.mutateAsync({ fromMint, amount, recipient })
    },
    [treasurySwapMutation],
  )

  // Claim rewards mutation - only HNT uses API, IOT/MOBILE use local txns
  const claimRewardsMutation = useMutation({
    mutationFn: async ({ txns }: { txns: VersionedTransaction[] }) => {
      if (!anchorProvider || !currentAccount || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const serializedTxs = txns.map((txn) => Buffer.from(txn.serialize()))

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('transactions.claimRewards'),
        message: t('transactions.signClaimRewardsTxn'),
        serializedTxs: serializedTxs.map(Buffer.from),
        renderer: () => (
          <MessagePreview warning={t('transactions.claimRewards')} />
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Batch transactions to prevent blockhash expiration
      return batchAndSubmitTransactions(
        anchorProvider,
        client,
        queryClient,
        txns,
        'claim-rewards',
        { type: 'claim', description: 'Claim rewards' },
      )
    },
  })

  const submitClaimRewards = useCallback(
    async (txns: VersionedTransaction[]) => {
      return claimRewardsMutation.mutateAsync({ txns })
    },
    [claimRewardsMutation],
  )

  // Claim all rewards mutation - uses API for HNT, SDK for IOT/MOBILE
  const claimAllRewardsMutation = useMutation({
    mutationFn: async ({
      lazyDistributors,
      hotspots,
    }: {
      lazyDistributors: PublicKey[]
      hotspots: HotspotWithPendingRewards[]
      totalHotspots: number | undefined
    }) => {
      if (!anchorProvider || !currentAccount || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const hntTxns: VersionedTransaction[] = []
      const iotMobileTxns: VersionedTransaction[] = []

      // Check which distributors are requested
      const claimHnt = lazyDistributors.some((ld) => ld.equals(HNT_LAZY_KEY))
      const claimIot = lazyDistributors.some((ld) => ld.equals(IOT_LAZY_KEY))
      const claimMobile = lazyDistributors.some((ld) =>
        ld.equals(MOBILE_LAZY_KEY),
      )

      // For HNT, use the API
      if (claimHnt) {
        try {
          const { transactionData } = await client.hotspots.claimRewards({
            walletAddress: currentAccount.solanaAddress!,
          })
          // Deserialize the transactions from the API response
          const hntTxnsFromApi = transactionData.transactions.map(
            ({ serializedTransaction }) =>
              VersionedTransaction.deserialize(
                Buffer.from(serializedTransaction, 'base64'),
              ),
          )
          hntTxns.push(...hntTxnsFromApi)
        } catch (e) {
          // If API fails, continue with IOT/MOBILE
          console.warn('HNT claim API failed, skipping:', e)
        }
      }

      // For IOT and MOBILE, build transactions using SDK bulk operations
      if (claimIot || claimMobile) {
        const lazyProgram = await initLazyDistributor(anchorProvider)
        const hemProgram = (await initHem(
          anchorProvider,
        )) as unknown as Program<HeliumEntityManager>
        const { connection } = anchorProvider

        // Filter hotspots with pending rewards
        const iotHotspots = claimIot
          ? hotspots.filter(
              (h) =>
                h.pendingRewards?.[Mints.IOT] &&
                new BN(h.pendingRewards[Mints.IOT]).gt(new BN(0)),
            )
          : []
        const mobileHotspots = claimMobile
          ? hotspots.filter(
              (h) =>
                h.pendingRewards?.[Mints.MOBILE] &&
                new BN(h.pendingRewards[Mints.MOBILE]).gt(new BN(0)),
            )
          : []

        // Get entity keys from hotspots in bulk
        const getEntityKeys = async (
          hotspotList: HotspotWithPendingRewards[],
        ): Promise<string[]> => {
          if (hotspotList.length === 0) return []
          const keyToAssets = hotspotList.map((h) =>
            keyToAssetForAsset(toAsset(h as CompressedNFT), DAO_KEY),
          )
          const ktaAccs = await getCachedKeyToAssets(
            hemProgram as any,
            keyToAssets,
          )
          return ktaAccs.map(
            (kta) =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              decodeEntityKey(kta.entityKey, kta.keySerialization)!,
          )
        }

        // Build IOT bulk transactions
        if (iotHotspots.length > 0) {
          try {
            const iotEntityKeys = await getEntityKeys(iotHotspots)
            const iotBulkRewards = await distributorOracle.getBulkRewards(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lazyProgram as any,
              IOT_LAZY_KEY,
              iotEntityKeys,
            )
            const iotAssets = iotHotspots.map((h) => new PublicKey(h.id))
            const iotTxns = await distributorOracle.formBulkTransactions({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              program: lazyProgram as any,
              rewards: iotBulkRewards,
              assets: iotAssets,
              lazyDistributor: IOT_LAZY_KEY,
              wallet: anchorProvider.wallet.publicKey,
              payer: anchorProvider.wallet.publicKey,
              assetEndpoint: connection.rpcEndpoint,
            })
            iotMobileTxns.push(...iotTxns)
          } catch (e) {
            console.warn('Failed to build IOT bulk claims:', e)
          }
        }

        // Build MOBILE bulk transactions
        if (mobileHotspots.length > 0) {
          try {
            const mobileEntityKeys = await getEntityKeys(mobileHotspots)
            const mobileBulkRewards = await distributorOracle.getBulkRewards(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lazyProgram as any,
              MOBILE_LAZY_KEY,
              mobileEntityKeys,
            )
            const mobileAssets = mobileHotspots.map((h) => new PublicKey(h.id))
            const mobileTxns = await distributorOracle.formBulkTransactions({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              program: lazyProgram as any,
              rewards: mobileBulkRewards,
              assets: mobileAssets,
              lazyDistributor: MOBILE_LAZY_KEY,
              wallet: anchorProvider.wallet.publicKey,
              payer: anchorProvider.wallet.publicKey,
              assetEndpoint: connection.rpcEndpoint,
            })
            iotMobileTxns.push(...mobileTxns)
          } catch (e) {
            console.warn('Failed to build MOBILE bulk claims:', e)
          }
        }
      }

      if (hntTxns.length === 0 && iotMobileTxns.length === 0) {
        throw new Error('No rewards to claim')
      }

      // Show wallet approval for all transactions
      const allTxnsForApproval = [...hntTxns, ...iotMobileTxns]
      const serializedTxs = allTxnsForApproval.map((txn) =>
        Buffer.from(txn.serialize()),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('collectablesScreen.hotspots.claimAllRewards'),
        message: t('transactions.signClaimRewardsTxn'),
        serializedTxs,
        renderer: () => (
          <MessagePreview
            warning={t('collectablesScreen.hotspots.claimAllRewards')}
          />
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      let lastBatchId: string | undefined

      // Submit HNT transactions (from API, no batching needed)
      if (hntTxns.length > 0) {
        const signedHntTxns = await anchorProvider.wallet.signAllTransactions(
          hntTxns,
        )
        const walletAddress =
          currentAccount.solanaAddress ||
          anchorProvider.wallet.publicKey.toBase58()
        const paramsHash = hashTagParams({ wallet: walletAddress })
        const hntTxnData = toTransactionData(signedHntTxns, {
          tag: `claim-hnt-${paramsHash}`,
          metadata: { type: 'claim', description: 'Claim HNT rewards' },
        })
        const { batchId } = await client.transactions.submit(hntTxnData)
        queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
        lastBatchId = batchId
      }

      // Batch and submit IOT/MOBILE transactions to prevent blockhash expiration
      if (iotMobileTxns.length > 0) {
        const iotMobileBatchId = await batchAndSubmitTransactions(
          anchorProvider,
          client,
          queryClient,
          iotMobileTxns,
          'claim-all-rewards-iot-mobile',
          { type: 'claim', description: 'Claim IOT/MOBILE rewards' },
        )
        lastBatchId = iotMobileBatchId
      }

      if (!lastBatchId) {
        throw new Error('No transactions were submitted')
      }

      return lastBatchId
    },
  })

  const submitClaimAllRewards = useCallback(
    async (
      lazyDistributors: PublicKey[],
      hotspots: HotspotWithPendingRewards[],
      totalHotspots: number | undefined,
    ) => {
      return claimAllRewardsMutation.mutateAsync({
        lazyDistributors,
        hotspots,
        totalHotspots,
      })
    },
    [claimAllRewardsMutation],
  )

  const submitLedger = useCallback(async () => {
    throw new Error('Solana not yet supported for ledger devices')
  }, [])

  // Mint data credits mutation
  const mintDataCreditsMutation = useMutation({
    mutationFn: async ({
      hntAmount,
      dcAmount,
      recipient,
    }: {
      hntAmount: BN
      dcAmount: BN
      recipient: PublicKey
    }) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const { connection } = anchorProvider
      const recipientExists = Boolean(
        await connection.getAccountInfo(recipient),
      )

      const txs = await solUtils.mintDataCredits({
        anchorProvider,
        dcAmount,
        recipient,
      })

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        warning: recipientExists ? '' : t('transactions.recipientNonExistent'),
        message: t('transactions.signMintDataCreditsTxn'),
        serializedTxs: txs.map(({ tx }) => Buffer.from(tx.serialize())),
        renderer: () => (
          <MessagePreview
            message={t('transactions.signMintDataCreditsTxnPreview', {
              hntAmount: humanReadable(hntAmount, 8),
              dcAmount: humanReadable(dcAmount, 0),
            })}
          />
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      const signedTxs = await Promise.all(
        txs.map(async ({ tx, signers }) => {
          const signed = await anchorProvider.wallet.signTransaction(tx)
          if (signers.length > 0) {
            await signed.sign(signers)
          }
          return signed
        }),
      )

      const mintParamsHash = hashTagParams({
        dcAmount: dcAmount.toString(),
        recipient: recipient.toBase58(),
      })
      const txnData = toTransactionData(signedTxs, {
        tag: `mint-dc-${mintParamsHash}`,
        metadata: { type: 'mint', description: 'Mint data credits' },
      })

      const { batchId } = await client.transactions.submit(txnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  const submitMintDataCredits = useCallback(
    async (params: { hntAmount: BN; dcAmount: BN; recipient: PublicKey }) => {
      return mintDataCreditsMutation.mutateAsync(params)
    },
    [mintDataCreditsMutation],
  )

  // Delegate data credits mutation
  const delegateDataCreditsMutation = useMutation({
    mutationFn: async ({
      delegateAddress,
      amount,
      mint,
      memo,
    }: {
      delegateAddress: string
      amount: number
      mint: PublicKey
      memo?: string
    }) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      // Build the draft transaction
      const delegateDCTxnDraft = await solUtils.delegateDataCredits(
        anchorProvider,
        delegateAddress,
        amount,
        mint,
        memo,
      )

      // Populate blockhash and other missing info
      const delegateDCTxn = await populateMissingDraftInfo(
        anchorProvider.connection,
        {
          ...delegateDCTxnDraft,
          recentBlockhash: (
            await anchorProvider.connection.getLatestBlockhash('finalized')
          ).blockhash,
        },
      )

      // Convert to TransactionData format
      const delegateParamsHash = hashTagParams({
        delegateAddress,
        timestamp: Date.now(),
      })
      const txnData = toTransactionData([toVersionedTx(delegateDCTxn)], {
        tag: `delegate-dc-${delegateParamsHash}`,
        metadata: { type: 'delegate', description: 'Delegate data credits' },
      })

      const serializedTxs = txnData.transactions.map((tx) =>
        Buffer.from(tx.serializedTransaction, 'base64'),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('transactions.delegateDC'),
        message: t('transactions.signDelegateDCTxn'),
        serializedTxs,
        renderer: () => (
          <PaymentPreivew
            {...{
              payments: [
                {
                  payee: delegateAddress,
                  balanceAmount: new BN(amount),
                },
              ],
              mint: DC_MINT,
            }}
          />
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign and submit via API
      const signedTxnData = await signTransactionData(
        anchorProvider.wallet,
        txnData,
      )
      const { batchId } = await client.transactions.submit(signedTxnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  const submitDelegateDataCredits = useCallback(
    async (
      delegateAddress: string,
      amount: number,
      mint: PublicKey,
      memo?: string,
    ) => {
      return delegateDataCreditsMutation.mutateAsync({
        delegateAddress,
        amount,
        mint,
        memo,
      })
    },
    [delegateDataCreditsMutation],
  )

  // Update entity info mutation
  const updateEntityInfoMutation = useMutation({
    mutationFn: async ({
      type,
      entityKey,
      lat,
      lng,
      elevation,
      decimalGain,
      payer,
    }: {
      type: NetworkType
      entityKey: string
      lat: number
      lng: number
      elevation?: string
      decimalGain?: string
      payer?: string
    }) => {
      if (!anchorProvider || !currentAccount || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const data = await getAssertData({
        networkDetails: [
          {
            hotspotType: type,
            decimalGain: decimalGain ? parseFloat(decimalGain) : undefined,
            elevation: elevation ? parseFloat(elevation) : undefined,
            lat,
            lng,
          },
        ],
        payer,
        owner: currentAccount.address,
        gateway: entityKey,
        // Onboarding record isn't actually used or needed, but if we don't
        // do this, the sdk will throw an error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onboardingRecord: {
          maker: {
            address: currentAccount.address,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      })

      const serializedTxs = data.solanaTransactions?.map((txn) =>
        Buffer.from(txn, 'base64'),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('collectablesScreen.hotspots.assertLocation'),
        message: t('transactions.signAssertLocationTxn'),
        serializedTxs,
        renderer: () => (
          <MessagePreview
            warning={`Please make sure you're asserting the correct location${
              decimalGain || elevation ? ' and correct antenna info' : ''
            } of this hotspot.`}
          />
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      const signedTxns =
        serializedTxs &&
        (await anchorProvider.wallet.signAllTransactions(
          serializedTxs.map((ser) => VersionedTransaction.deserialize(ser)),
        ))

      if (!signedTxns) {
        throw new Error('No transactions to sign')
      }

      const locationParamsHash = hashTagParams({
        entityKey,
        lat,
        lng,
        elevation: elevation || undefined,
        decimalGain: decimalGain || undefined,
      })
      const txnData = toTransactionData(signedTxns, {
        tag: `assert-location-${locationParamsHash}`,
        metadata: { type: 'assert', description: 'Assert hotspot location' },
      })

      const { batchId } = await client.transactions.submit(txnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  const submitUpdateEntityInfo = useCallback(
    async (params: {
      type: NetworkType
      entityKey: string
      lat: number
      lng: number
      elevation?: string
      decimalGain?: string
      payer?: string
    }) => {
      return updateEntityInfoMutation.mutateAsync(params)
    },
    [updateEntityInfoMutation],
  )

  // Update rewards destination mutation - uses API endpoint
  const updateRewardsDestinationMutation = useMutation({
    mutationFn: async ({
      lazyDistributors,
      destination,
      assetId,
      payer: _payer,
    }: {
      lazyDistributors: PublicKey[]
      destination: string
      assetId: string
      payer?: string
    }) => {
      if (
        !anchorProvider ||
        !currentAccount?.solanaAddress ||
        !walletSignBottomSheetRef
      ) {
        throw new Error(t('errors.account'))
      }

      const { connection } = anchorProvider
      const destinationPk = new PublicKey(destination)
      const destinationExists = Boolean(
        await connection.getAccountInfo(destinationPk),
      )

      // Get CompressedNFT from assetId and derive entityKey
      const conn = connection as WrappedConnection
      const asset = (await conn.getAsset<{ result: CompressedNFT }>(assetId))
        .result
      const entityKey = await getEntityKeyFromCompressedNFT(
        anchorProvider,
        asset,
      )

      // Use API endpoint
      const { transactionData } =
        await client.hotspots.updateRewardsDestination({
          walletAddress: currentAccount.solanaAddress,
          hotspotPubkey: entityKey,
          destination,
          lazyDistributors: lazyDistributors.map((ld) => ld.toBase58()),
        })

      const serializedTxs = transactionData.transactions.map((tx) =>
        Buffer.from(tx.serializedTransaction, 'base64'),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        warning: destinationExists
          ? ''
          : t('transactions.recipientNonExistent'),
        header: t('transactions.updateRecipient'),
        message: t('transactions.signPaymentTxn'),
        serializedTxs,
        renderer: () => (
          <MessagePreview
            warning={`New Recipient: ${ellipsizeAddress(destination)}`}
          />
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign and submit
      const signedTxnData = await signTransactionData(
        anchorProvider.wallet,
        transactionData,
      )

      const { batchId } = await client.transactions.submit(signedTxnData)
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] })
      return batchId
    },
  })

  const submitUpdateRewardsDestination = useCallback(
    async (params: {
      lazyDistributors: PublicKey[]
      destination: string
      assetId: string
      payer?: string
    }) => {
      return updateRewardsDestinationMutation.mutateAsync(params)
    },
    [updateRewardsDestinationMutation],
  )

  return {
    submitPayment,
    submitCollectable,
    submitJupiterSwap,
    submitTreasurySwap,
    submitClaimRewards,
    submitClaimAllRewards,
    submitLedger,
    submitMintDataCredits,
    submitDelegateDataCredits,
    submitUpdateEntityInfo,
    submitUpdateRewardsDestination,
    // Also expose mutations for callers that want isPending/error states
    paymentMutation,
    collectableMutation,
    jupiterSwapMutation,
    treasurySwapMutation,
    claimRewardsMutation,
    claimAllRewardsMutation,
    mintDataCreditsMutation,
    delegateDataCreditsMutation,
    updateEntityInfoMutation,
    updateRewardsDestinationMutation,
  }
}
