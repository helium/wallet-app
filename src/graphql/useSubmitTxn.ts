import { useCallback, useState } from 'react'
import Balance, {
  MobileTokens,
  NetworkTokens,
  TestNetworkTokens,
  Ticker,
} from '@helium/currency'
import { PaymentV2 } from '@helium/transactions'
import { PublicKey, Transaction } from '@solana/web3.js'
import i18n from '@utils/i18n'
import { Mints } from '@utils/constants'
import { useTransactions } from '../storage/TransactionProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAccountLazyQuery, useSubmitTxnMutation } from '../generated/graphql'
import { useAppStorage } from '../storage/AppStorageProvider'
import {
  makeCollectablePayment,
  makePayment,
  claimRewards,
  claimAllRewards,
  sendAnchorTxn,
  sendTreasurySwap,
  sendMintDataCredits,
  sendDelegateDataCredits,
  readBalances,
} from '../store/slices/solanaSlice'
import { useAppDispatch } from '../store/store'
import { Collectable, CompressedNFT } from '../types/solana'

export default () => {
  const { makePaymentTxn } = useTransactions()
  const { currentAccount, anchorProvider } = useAccountStorage()
  const { l1Network, solanaNetwork: cluster } = useAppStorage()
  const { t } = i18n

  const dispatch = useAppDispatch()

  const [fetchAccount, { loading: accountLoading, error: accountError }] =
    useAccountLazyQuery({
      variables: {
        address: currentAccount?.address || '',
      },
      fetchPolicy: 'cache-and-network',
    })

  const [
    submitTxnMutation,
    { data, loading: submitLoading, error: submitError },
  ] = useSubmitTxnMutation({ fetchPolicy: 'network-only' })

  const [nonceError, setNonceError] = useState<Error>()

  const submitHelium = useCallback(
    async (
      payments: {
        payee: string
        balanceAmount: Balance<NetworkTokens | TestNetworkTokens | MobileTokens>
        memo: string
        max?: boolean
      }[],
      ticker: Ticker,
    ) => {
      if (!currentAccount) {
        throw new Error(t('errors.account'))
      }

      try {
        const { data: freshAccountData } = await fetchAccount()
        if (typeof freshAccountData?.account?.speculativeNonce !== 'number') {
          setNonceError(
            new Error(
              'Could not find speculative nonce for the current account',
            ),
          )

          return
        }
        const { txnJson, signedTxn } = await makePaymentTxn({
          paymentDetails: payments,
          speculativeNonce: freshAccountData.account.speculativeNonce,
          ticker,
        })

        if (!signedTxn) {
          throw new Error('Failed to sign transaction')
        }

        const variables = {
          address: currentAccount.address,
          txnJson,
          txn: signedTxn.toString(),
        }

        submitTxnMutation({ variables })
      } catch (e) {}
    },
    [currentAccount, fetchAccount, makePaymentTxn, submitTxnMutation, t],
  )
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
      ticker: Ticker,
    ) => {
      switch (l1Network) {
        case 'helium':
          submitHelium(payments, ticker)
          break
        case 'solana':
          submitSolDev(payments)
          break
      }
    },
    [l1Network, submitHelium, submitSolDev],
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
          account: currentAccount,
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

  const submitHeliumLedger = useCallback(
    async ({ txn, txnJson }: { txn: PaymentV2; txnJson: string }) => {
      if (!currentAccount?.address) {
        throw new Error(t('errors.account'))
      }

      const variables = {
        address: currentAccount.address,
        txnJson,
        txn: txn.toString(),
      }

      submitTxnMutation({ variables })
    },
    [currentAccount, submitTxnMutation, t],
  )

  const submitLedger = useCallback(
    async ({ txn, txnJson }: { txn: PaymentV2; txnJson: string }) => {
      switch (l1Network) {
        case 'helium':
          submitHeliumLedger({ txn, txnJson })
          break
        case 'solana':
          throw new Error('Solana not yet supported for ledger devices')
      }
    },
    [l1Network, submitHeliumLedger],
  )

  const submitMintDataCredits = useCallback(
    async (hntAmount: number, recipient: PublicKey) => {
      if (!currentAccount || !anchorProvider) {
        throw new Error(t('errors.account'))
      }

      await dispatch(
        sendMintDataCredits({
          account: currentAccount,
          anchorProvider,
          cluster,
          hntAmount,
          recipient,
        }),
      )

      dispatch(readBalances({ anchorProvider, acct: currentAccount }))
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
          account: currentAccount,
          anchorProvider,
          cluster,
          delegateAddress,
          amount,
          mint,
        }),
      )

      dispatch(readBalances({ anchorProvider, acct: currentAccount }))
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
    data,
    error: accountError || submitError || nonceError,
    loading: accountLoading || submitLoading,
  }
}
