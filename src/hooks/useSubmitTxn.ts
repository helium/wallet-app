import { useCallback } from 'react'
import Balance, { AnyCurrencyType } from '@helium/currency'
import { PublicKey, Transaction } from '@solana/web3.js'
import i18n from '@utils/i18n'
import { Mints } from '@utils/constants'
import * as solUtils from '@utils/solanaUtils'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { HotspotType } from '@helium/onboarding'
import {
  BalanceChange,
  WalletStandardMessageTypes,
} from '../solana/walletSignBottomSheetTypes'
import {
  makeCollectablePayment,
  makePayment,
  claimRewards,
  claimAllRewards,
  sendAnchorTxn,
  sendTreasurySwap,
  sendMintDataCredits,
  sendDelegateDataCredits,
  sendUpdateIotInfo,
  sendUpdateMobileInfo,
} from '../store/slices/solanaSlice'
import { useAppDispatch } from '../store/store'
import {
  Collectable,
  CompressedNFT,
  HotspotWithMeta,
  toMintAddress,
} from '../types/solana'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'

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
        balanceAmount: Balance<AnyCurrencyType>
        max?: boolean
      }[],
    ) => {
      if (
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        !walletSignBottomSheetRef
      ) {
        throw new Error(t('errors.account'))
      }

      const [firstPayment] = payments
      const mintAddress =
        firstPayment.balanceAmount.type.ticker !== 'SOL'
          ? toMintAddress(firstPayment.balanceAmount.type.ticker, Mints)
          : undefined
      const paymentTxn = await solUtils.transferToken(
        anchorProvider,
        currentAccount.solanaAddress,
        currentAccount.address,
        payments,
        mintAddress,
      )

      const serializedTx = paymentTxn.serialize({
        requireAllSignatures: false,
      })

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signPaymentTxn'),
        serializedTx: Buffer.from(serializedTx),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      dispatch(
        makePayment({
          paymentTxn,
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
        serializedTx: Buffer.from(serializedTx),
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
        additionalMessage: t('transactions.signSwapTxn'),
        serializedTx: Buffer.from(serializedTx),
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
        serializedTx: Buffer.from(serializedTx),
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

      const serializedTx = txns[0].serialize({
        requireAllSignatures: false,
      })

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signClaimRewardsTxn'),
        serializedTx: Buffer.from(serializedTx),
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
      hotspots: HotspotWithMeta[],
      balanceChanges: BalanceChange[],
    ) => {
      if (!anchorProvider || !currentAccount || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      // Estimating fee in lamports. Not the best but works for now (:
      const claimAllEstimatedFee =
        hotspots.length !== 0 ? (hotspots.length / 2) * 5000 : 5000

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signClaimAllRewardsTxn'),
        manualEstimatedFee: claimAllEstimatedFee,
        manualBalanceChanges: balanceChanges,
        serializedTx: undefined,
      })

      if (!decision) {
        throw new Error('User rejected transaction')
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
    async ({
      dcAmount,
      recipient,
    }: {
      dcAmount: number
      recipient: PublicKey
    }) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

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
        additionalMessage: t('transactions.signMintDataCreditsTxn'),
        serializedTx: Buffer.from(serializedTx),
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
    async (delegateAddress: string, amount: number, mint: PublicKey) => {
      if (!currentAccount || !anchorProvider || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      const delegateDCTxn = await solUtils.delegateDataCredits(
        anchorProvider,
        delegateAddress,
        amount,
        mint,
      )

      const serializedTx = delegateDCTxn.serialize({
        requireAllSignatures: false,
      })

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signDelegateDCTxn'),
        serializedTx: Buffer.from(serializedTx),
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

  const submitUpdateHotspotInfo = useCallback(
    async ({
      type,
      hotspot,
      location,
      elevation,
      gain,
    }: {
      type: HotspotType
      hotspot: HotspotWithMeta
      location: string
      elevation?: number
      gain?: number
    }) => {
      if (!anchorProvider || !currentAccount || !walletSignBottomSheetRef) {
        throw new Error(t('errors.account'))
      }

      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      const updateInfoTxn = await solUtils.updateHotspotInfoTxn({
        anchorProvider,
        type,
        hotspot,
        location,
        elevation,
        gain,
      })

      const serializedTx = updateInfoTxn.serialize({
        requireAllSignatures: false,
      })

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        additionalMessage: t('transactions.signDelegateDCTxn'),
        serializedTx: Buffer.from(serializedTx),
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
    submitUpdateHotspotInfo,
  }
}
