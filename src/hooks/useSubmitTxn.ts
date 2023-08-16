import { HotspotType } from '@helium/onboarding'
import { chunks } from '@helium/spl-utils'
import { PublicKey, Transaction } from '@solana/web3.js'
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
  sendAnchorTxn,
  sendDelegateDataCredits,
  sendMintDataCredits,
  sendTreasurySwap,
  sendUpdateIotInfo,
  sendUpdateMobileInfo,
} from '../store/slices/solanaSlice'
import { useAppDispatch } from '../store/store'
import {
  Collectable,
  CompressedNFT,
  HotspotWithPendingRewards,
} from '../types/solana'

export default () => {
  const { currentAccount } = useAccountStorage()
  const { cluster, anchorProvider } = useSolana()
  const { t } = i18n
  const { walletSignBottomSheetRef } = useWalletSign()

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
        chunks(payments, 5).map((p) => {
          return solUtils.transferToken(
            anchorProvider,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            currentAccount.solanaAddress!,
            currentAccount.address,
            p,
            mint.toBase58(),
          )
        }),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signPaymentTxn'),
        serializedTxs: txns.map((tx) =>
          tx.serialize({
            requireAllSignatures: false,
          }),
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

      const serializedTx = transferTxn.serialize({
        requireAllSignatures: false,
      })

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

      const serializedTx = swapTxn.serialize({
        requireAllSignatures: false,
      })

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

  const submitAnchorTxn = useCallback(
    async (txn: Transaction) => {
      if (!anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const serializedTx = txn.serialize({
        requireAllSignatures: false,
      })

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signGenericTxn'),
        serializedTxs: [Buffer.from(serializedTx)],
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      dispatch(
        sendAnchorTxn({
          txn,
          anchorProvider,
          cluster,
        }),
      )
    },
    [anchorProvider, cluster, dispatch, t, walletSignBottomSheetRef],
  )

  const submitClaimRewards = useCallback(
    async (txns: Transaction[]) => {
      if (!anchorProvider) {
        throw new Error(t('errors.account'))
      }

      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      if (!walletSignBottomSheetRef) {
        throw new Error('No wallet sign bottom sheet ref')
      }

      const serializedTxs = txns.map((txn) =>
        txn.serialize({
          requireAllSignatures: false,
        }),
      )

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

      const swapTxn = await solUtils.mintDataCredits({
        anchorProvider,
        dcAmount,
        recipient,
      })

      const serializedTx = swapTxn.serialize({
        requireAllSignatures: false,
      })

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

      const delegateDCTxn = await solUtils.delegateDataCredits(
        anchorProvider,
        delegateAddress,
        amount,
        mint,
        memo,
      )

      const serializedTx = delegateDCTxn.serialize({
        requireAllSignatures: false,
      })

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
    }: {
      type: HotspotType
      entityKey: string
      lat: number
      lng: number
      elevation?: string
      decimalGain?: string
    }) => {
      if (!anchorProvider || !currentAccount || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      const updateInfoTxn = await solUtils.updateEntityInfoTxn({
        anchorProvider,
        type,
        entityKey,
        lat,
        lng,
        elevation: elevation ? parseFloat(elevation) : undefined,
        decimalGain: decimalGain ? parseFloat(decimalGain) : undefined,
      })

      const serializedTx = updateInfoTxn.serialize({
        requireAllSignatures: false,
      })

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signAssertLocationTxn'),
        serializedTxs: [Buffer.from(serializedTx)],
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      if (type === 'iot') {
        await dispatch(
          sendUpdateIotInfo({
            account: currentAccount,
            anchorProvider,
            cluster,
            updateTxn: updateInfoTxn,
          }),
        )
      }

      if (type === 'mobile') {
        await dispatch(
          sendUpdateMobileInfo({
            account: currentAccount,
            anchorProvider,
            cluster,
            updateTxn: updateInfoTxn,
          }),
        )
      }
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

  return {
    submitPayment,
    submitCollectable,
    submitTreasurySwap,
    submitAnchorTxn,
    submitClaimRewards,
    submitClaimAllRewards,
    submitLedger,
    submitMintDataCredits,
    submitDelegateDataCredits,
    submitUpdateEntityInfo,
  }
}
