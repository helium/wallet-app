import { NetworkType } from '@helium/onboarding'
import { useOnboarding } from '@helium/react-native-sdk'
import {
  chunks,
  populateMissingDraftInfo,
  sendAndConfirmWithRetry,
  toVersionedTx,
} from '@helium/spl-utils'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import i18n from '@utils/i18n'
import * as solUtils from '@utils/solanaUtils'
import BN from 'bn.js'
import { useCallback } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import {
  claimAllRewards,
  claimRewards,
  makeCollectablePayment,
  makePayment,
  sendDelegateDataCredits,
  sendJupiterSwap,
  sendMintDataCredits,
  sendTreasurySwap,
  updateRewardsDestinations,
} from '../store/slices/solanaSlice'
import { useAppDispatch } from '../store/store'
import {
  Collectable,
  CompressedNFT,
  HotspotWithPendingRewards,
} from '../types/solana'

export default () => {
  const { cluster, anchorProvider } = useSolana()
  const { currentAccount } = useAccountStorage()
  const { t } = i18n
  const { walletSignBottomSheetRef } = useWalletSign()
  const { getAssertData } = useOnboarding()

  const dispatch = useAppDispatch()

  const submitPayment = useCallback(
    async (
      payments: {
        payee: string
        balanceAmount: BN
        max?: boolean
      }[],
      mint: PublicKey,
    ) => {
      if (
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        !walletSignBottomSheetRef
      ) {
        throw new Error(t('errors.account'))
      }

      const txns = await Promise.all(
        chunks(payments, 5).map(async (p) => {
          return populateMissingDraftInfo(
            anchorProvider.connection,
            await solUtils.transferToken(
              anchorProvider,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              currentAccount.solanaAddress!,
              currentAccount.address,
              p,
              mint.toBase58(),
            ),
          )
        }),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signPaymentTxn'),
        serializedTxs: txns.map((tx) =>
          Buffer.from(toVersionedTx(tx).serialize()),
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      dispatch(
        makePayment({
          paymentTxns: txns,
          account: currentAccount,
          cluster,
          anchorProvider,
        }),
      )
    },
    [
      currentAccount,
      dispatch,
      t,
      anchorProvider,
      cluster,
      walletSignBottomSheetRef,
    ],
  )

  const submitCollectable = useCallback(
    async (collectable: CompressedNFT | Collectable, payee: string) => {
      if (
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        !walletSignBottomSheetRef
      ) {
        throw new Error(t('errors.account'))
      }

      const compressedNFT = collectable as CompressedNFT
      const nft = collectable as Collectable

      const transferTxn = compressedNFT?.compression?.compressed
        ? await solUtils.transferCompressedCollectable(
            anchorProvider,
            currentAccount.solanaAddress,
            currentAccount.address,
            compressedNFT,
            payee,
          )
        : await solUtils.transferCollectable(
            anchorProvider,
            currentAccount.solanaAddress,
            currentAccount.address,
            nft,
            payee,
          )

      const serializedTx = toVersionedTx(
        await populateMissingDraftInfo(anchorProvider.connection, transferTxn),
      ).serialize()

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signTransferCollectableTxn'),
        serializedTxs: [Buffer.from(serializedTx)],
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      dispatch(
        makeCollectablePayment({
          account: currentAccount,
          transferTxn,
          cluster,
          anchorProvider,
        }),
      )
    },
    [
      cluster,
      currentAccount,
      dispatch,
      t,
      anchorProvider,
      walletSignBottomSheetRef,
    ],
  )

  const submitJupiterSwap = useCallback(
    async (swapTxn: VersionedTransaction) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const serializedTx = Buffer.from(swapTxn.serialize())

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signSwapTxn'),
        serializedTxs: [Buffer.from(serializedTx)],
        suppressWarnings: true,
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      dispatch(
        sendJupiterSwap({
          anchorProvider,
          cluster,
          swapTxn,
        }),
      )
    },
    [
      anchorProvider,
      cluster,
      currentAccount,
      dispatch,
      t,
      walletSignBottomSheetRef,
    ],
  )

  const submitTreasurySwap = useCallback(
    async (fromMint: PublicKey, amount: number, recipient: PublicKey) => {
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

      const serializedTx = toVersionedTx(
        await populateMissingDraftInfo(connection, swapTxn),
      ).serialize()

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        warning: recipientExists ? '' : t('transactions.recipientNonExistent'),
        additionalMessage: t('transactions.signSwapTxn'),
        serializedTxs: [Buffer.from(serializedTx)],
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      dispatch(
        sendTreasurySwap({
          anchorProvider,
          cluster,
          swapTxn,
        }),
      )
    },
    [
      anchorProvider,
      cluster,
      currentAccount,
      dispatch,
      t,
      walletSignBottomSheetRef,
    ],
  )

  const submitClaimRewards = useCallback(
    async (txns: VersionedTransaction[]) => {
      if (!anchorProvider) {
        throw new Error(t('errors.account'))
      }

      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      if (!walletSignBottomSheetRef) {
        throw new Error('No wallet sign bottom sheet ref')
      }

      const serializedTxs = txns.map((txn) => Buffer.from(txn.serialize()))

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signClaimRewardsTxn'),
        serializedTxs: serializedTxs.map(Buffer.from),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      dispatch(
        claimRewards({
          account: currentAccount,
          txns,
          anchorProvider,
          cluster,
        }),
      )
    },
    [
      anchorProvider,
      cluster,
      currentAccount,
      dispatch,
      t,
      walletSignBottomSheetRef,
    ],
  )

  const submitClaimAllRewards = useCallback(
    async (
      lazyDistributors: PublicKey[],
      hotspots: HotspotWithPendingRewards[],
      totalHotspots: number | undefined,
    ) => {
      if (!anchorProvider || !currentAccount || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      dispatch(
        claimAllRewards({
          account: currentAccount,
          lazyDistributors,
          hotspots,
          anchorProvider,
          cluster,
          totalHotspots,
        }),
      )
    },
    [
      anchorProvider,
      cluster,
      currentAccount,
      dispatch,
      t,
      walletSignBottomSheetRef,
    ],
  )

  const submitLedger = useCallback(async () => {
    throw new Error('Solana not yet supported for ledger devices')
  }, [])

  const submitMintDataCredits = useCallback(
    async ({ dcAmount, recipient }: { dcAmount: BN; recipient: PublicKey }) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const { connection } = anchorProvider
      const recipientExists = Boolean(
        await connection.getAccountInfo(recipient),
      )

      const draft = await solUtils.mintDataCredits({
        anchorProvider,
        dcAmount,
        recipient,
      })
      const swapTxn = await populateMissingDraftInfo(connection, draft)

      const serializedTx = toVersionedTx(swapTxn).serialize()

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        warning: recipientExists ? '' : t('transactions.recipientNonExistent'),
        additionalMessage: t('transactions.signMintDataCreditsTxn'),
        serializedTxs: [Buffer.from(serializedTx)],
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      await dispatch(
        sendMintDataCredits({
          anchorProvider,
          cluster,
          swapTxn,
        }),
      )
    },
    [
      anchorProvider,
      cluster,
      currentAccount,
      dispatch,
      t,
      walletSignBottomSheetRef,
    ],
  )

  const submitDelegateDataCredits = useCallback(
    async (
      delegateAddress: string,
      amount: number,
      mint: PublicKey,
      memo?: string,
    ) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const delegateDCTxn = await populateMissingDraftInfo(
        anchorProvider.connection,
        await solUtils.delegateDataCredits(
          anchorProvider,
          delegateAddress,
          amount,
          mint,
          memo,
        ),
      )

      const serializedTx = toVersionedTx(delegateDCTxn).serialize()

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signDelegateDCTxn'),
        serializedTxs: [Buffer.from(serializedTx)],
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      await dispatch(
        sendDelegateDataCredits({
          anchorProvider,
          cluster,
          delegateDCTxn,
        }),
      )
    },
    [
      anchorProvider,
      cluster,
      currentAccount,
      dispatch,
      t,
      walletSignBottomSheetRef,
    ],
  )

  const submitUpdateEntityInfo = useCallback(
    async ({
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
        } as any,
      })

      const serializedTxs = data.solanaTransactions?.map((txn) =>
        Buffer.from(txn, 'base64'),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signAssertLocationTxn'),
        serializedTxs,
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }
      const signedTxns =
        serializedTxs &&
        (await anchorProvider.wallet.signAllTransactions(
          serializedTxs.map((ser) => Transaction.from(ser)),
        ))

      try {
        // eslint-disable-next-line no-restricted-syntax
        for (const txn of signedTxns || []) {
          // eslint-disable-next-line no-await-in-loop
          await sendAndConfirmWithRetry(
            anchorProvider.connection,
            txn.serialize(),
            {
              skipPreflight: true,
            },
            'confirmed',
          )
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (solUtils.isInsufficientBal(e)) {
          if (data.isFree) {
            throw new Error(
              `Manufacturer ${data?.maker?.name} does not have enough SOL or Data Credits to assert location. Please contact the manufacturer of this hotspot to resolve this issue.`,
            )
          } else {
            throw new Error(
              'Insufficient balance of either HNT, Data Credits, or Sol to assert location',
            )
          }
        }
        if (e.InstructionError) {
          throw new Error(`Program Error: ${JSON.stringify(e)}`)
        }
        throw e
      }
    },
    [
      anchorProvider,
      currentAccount,
      getAssertData,
      t,
      walletSignBottomSheetRef,
    ],
  )

  const submitUpdateRewardsDestination = useCallback(
    async ({
      lazyDistributors,
      destination,
      assetId,
      payer,
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
      const assetPk = new PublicKey(assetId)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const payeePk = new PublicKey(payer || currentAccount.solanaAddress!)
      const destinationPk = new PublicKey(destination)
      const destinationExists = Boolean(
        await connection.getAccountInfo(destinationPk),
      )

      const txn = await populateMissingDraftInfo(
        anchorProvider.connection,
        await solUtils.createUpdateCompressionDestinationTxn(
          anchorProvider,
          lazyDistributors,
          payeePk,
          assetPk,
          destinationPk,
        ),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        warning: destinationExists
          ? ''
          : t('transactions.recipientNonExistent'),
        additionalMessage: t('transactions.signPaymentTxn'),
        serializedTxs: [Buffer.from(toVersionedTx(txn).serialize())],
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      dispatch(
        updateRewardsDestinations({
          txn,
          account: currentAccount,
          cluster,
          anchorProvider,
        }),
      )
    },
    [
      t,
      dispatch,
      cluster,
      anchorProvider,
      currentAccount,
      walletSignBottomSheetRef,
    ],
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
  }
}
