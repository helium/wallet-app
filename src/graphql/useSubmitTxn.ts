import { useCallback, useState } from 'react'
import Balance, {
  MobileTokens,
  NetworkTokens,
  TestNetworkTokens,
  Ticker,
} from '@helium/currency'
import { PaymentV2 } from '@helium/transactions'
import { Transaction } from '@solana/web3.js'
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
} from '../store/slices/solanaSlice'
import { useAppDispatch } from '../store/store'
import { useGetMintsQuery } from '../store/slices/walletRestApi'
import { CompressedNFT } from '../types/solana'

export default () => {
  const { makePaymentTxn } = useTransactions()
  const { currentAccount, anchorProvider } = useAccountStorage()
  const { l1Network, solanaNetwork: cluster } = useAppStorage()
  const { data: mints } = useGetMintsQuery(cluster)
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
        throw new Error('There must be an account selected to submit a txn')
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
    [currentAccount, fetchAccount, makePaymentTxn, submitTxnMutation],
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
      if (!currentAccount) {
        throw new Error('There must be an account selected to submit a txn')
      }
      if (!mints) {
        throw new Error('Mints not found')
      }

      dispatch(
        makePayment({
          account: currentAccount,
          payments,
          cluster,
          mints,
        }),
      )
    },
    [currentAccount, dispatch, mints, cluster],
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
    async (collectable: CompressedNFT, payee: string) => {
      if (!currentAccount) {
        throw new Error('There must be an account selected to submit a txn')
      }
      dispatch(
        makeCollectablePayment({
          account: currentAccount,
          collectable,
          payee,
          cluster,
        }),
      )
    },
    [cluster, currentAccount, dispatch],
  )

  const submitAnchorTxn = useCallback(
    async (txn: Transaction) => {
      if (!anchorProvider) {
        throw new Error('There must be an account selected to submit a txn')
      }
      dispatch(
        sendAnchorTxn({
          txn,
          anchorProvider,
          cluster,
        }),
      )
    },
    [anchorProvider, cluster, dispatch],
  )

  const submitClaimRewards = useCallback(
    async (txn: Transaction) => {
      if (!anchorProvider) {
        throw new Error('There must be an account selected to submit a txn')
      }

      if (!currentAccount) {
        throw new Error('There must be an account selected to submit a txn')
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
    [anchorProvider, cluster, currentAccount, dispatch],
  )

  const submitClaimAllRewards = useCallback(
    async (txns: Transaction[]) => {
      if (!anchorProvider) {
        throw new Error('There must be an account selected to submit a txn')
      }

      if (!currentAccount) {
        throw new Error('There must be an account selected to submit a txn')
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
    [anchorProvider, cluster, currentAccount, dispatch],
  )

  const submitHeliumLedger = useCallback(
    async ({ txn, txnJson }: { txn: PaymentV2; txnJson: string }) => {
      if (!currentAccount?.address) {
        throw new Error('There must be an account selected to submit a txn')
      }

      const variables = {
        address: currentAccount.address,
        txnJson,
        txn: txn.toString(),
      }

      submitTxnMutation({ variables })
    },
    [currentAccount, submitTxnMutation],
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

  return {
    submit,
    submitCollectable,
    submitAnchorTxn,
    submitClaimRewards,
    submitClaimAllRewards,
    submitLedger,
    data,
    error: accountError || submitError || nonceError,
    loading: accountLoading || submitLoading,
  }
}
