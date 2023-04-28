import { useCallback } from 'react'
import Balance, {
  MobileTokens,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { PublicKey, Transaction } from '@solana/web3.js'
import i18n from '@utils/i18n'
import { Mints } from '@utils/constants'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import {
  makeCollectablePayment,
  makePayment,
  claimRewards,
  claimAllRewards,
  sendAnchorTxn,
  sendTreasurySwap,
  sendMintDataCredits,
  sendDelegateDataCredits,
} from '../store/slices/solanaSlice'
import { useAppDispatch } from '../store/store'
import { Collectable, CompressedNFT } from '../types/solana'
import { useSolana } from '../solana/SolanaProvider'

export default () => {
  const { currentAccount } = useAccountStorage()
  const { cluster, anchorProvider } = useSolana()
  const { t } = i18n

  const dispatch = useAppDispatch()

  const submitSolDev = useCallback(
    async (
      payments: {
        payee: string
        balanceAmount: Balance<NetworkTokens | TestNetworkTokens | MobileTokens>
        memo: string
        max?: boolean
      }[],
    ) => {
      if (!currentAccount || !anchorProvider) {
        throw new Error(t('errors.account'))
      }

      dispatch(
        makePayment({
          account: currentAccount,
          payments,
          cluster,
          anchorProvider,
          mints: Mints,
        }),
      )
    },
    [currentAccount, dispatch, t, anchorProvider, cluster],
  )

  const submit = useCallback(
    async (
      payments: {
        payee: string
        balanceAmount: Balance<NetworkTokens | TestNetworkTokens | MobileTokens>
        memo: string
        max?: boolean
      }[],
    ) => {
      submitSolDev(payments)
    },
    [submitSolDev],
  )

  const submitCollectable = useCallback(
    async (collectable: CompressedNFT | Collectable, payee: string) => {
      if (!currentAccount || !anchorProvider) {
        throw new Error(t('errors.account'))
      }
      dispatch(
        makeCollectablePayment({
          account: currentAccount,
          collectable,
          payee,
          cluster,
          anchorProvider,
        }),
      )
    },
    [cluster, currentAccount, dispatch, t, anchorProvider],
  )

  const submitTreasurySwap = useCallback(
    async (fromMint: PublicKey, amount: number, recipient: PublicKey) => {
      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      if (!anchorProvider) {
        throw new Error(t('errors.account'))
      }

      dispatch(
        sendTreasurySwap({
          anchorProvider,
          cluster,
          fromMint,
          amount,
          mints: Mints,
          recipient,
        }),
      )
    },
    [anchorProvider, cluster, currentAccount, dispatch, t],
  )

  const submitAnchorTxn = useCallback(
    async (txn: Transaction) => {
      if (!anchorProvider) {
        throw new Error(t('errors.account'))
      }
      dispatch(
        sendAnchorTxn({
          txn,
          anchorProvider,
          cluster,
        }),
      )
    },
    [anchorProvider, cluster, dispatch, t],
  )

  const submitClaimRewards = useCallback(
    async (txn: Transaction) => {
      if (!anchorProvider) {
        throw new Error(t('errors.account'))
      }

      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      dispatch(
        claimRewards({
          account: currentAccount,
          txn,
          anchorProvider,
          cluster,
        }),
      )
    },
    [anchorProvider, cluster, currentAccount, dispatch, t],
  )

  const submitClaimAllRewards = useCallback(
    async (txns: Transaction[]) => {
      if (!anchorProvider) {
        throw new Error(t('errors.account'))
      }

      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      dispatch(
        claimAllRewards({
          account: currentAccount,
          txns,
          anchorProvider,
          cluster,
        }),
      )
    },
    [anchorProvider, cluster, currentAccount, dispatch, t],
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
      if (!currentAccount || !anchorProvider) {
        throw new Error(t('errors.account'))
      }

      await dispatch(
        sendMintDataCredits({
          anchorProvider,
          cluster,
          dcAmount,
          recipient,
        }),
      )
    },
    [anchorProvider, cluster, currentAccount, dispatch, t],
  )

  const submitDelegateDataCredits = useCallback(
    async (delegateAddress: string, amount: number, mint: PublicKey) => {
      if (!currentAccount || !anchorProvider) {
        throw new Error(t('errors.account'))
      }

      await dispatch(
        sendDelegateDataCredits({
          anchorProvider,
          cluster,
          delegateAddress,
          amount,
          mint,
        }),
      )
    },
    [anchorProvider, cluster, currentAccount, dispatch, t],
  )

  return {
    submit,
    submitCollectable,
    submitTreasurySwap,
    submitAnchorTxn,
    submitClaimRewards,
    submitClaimAllRewards,
    submitLedger,
    submitMintDataCredits,
    submitDelegateDataCredits,
  }
}
