import { useCallback, useState } from 'react'
import Balance, {
  MobileTokens,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { PaymentV2 } from '@helium/transactions'
import { useTransactions } from '../storage/TransactionProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAccountLazyQuery, useSubmitTxnMutation } from '../generated/graphql'
import { useAppStorage } from '../storage/AppStorageProvider'
import { makePayment } from '../store/slices/solanaSlice'
import { useAppDispatch } from '../store/store'
import { TokenType } from '../types/activity'

export default () => {
  const { makePaymentTxn } = useTransactions()
  const { currentAccount } = useAccountStorage()
  const { l1Network } = useAppStorage()
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
      tokenType: TokenType,
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
          tokenType,
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
      _tokenType: TokenType,
    ) => {
      if (!currentAccount) {
        throw new Error('There must be an account selected to submit a txn')
      }
      dispatch(makePayment({ account: currentAccount, payments }))
    },
    [currentAccount, dispatch],
  )

  const submit = useCallback(
    async (
      payments: {
        payee: string
        balanceAmount: Balance<NetworkTokens | TestNetworkTokens | MobileTokens>
        memo: string
        max?: boolean
      }[],
      tokenType: TokenType,
    ) => {
      switch (l1Network) {
        case 'helium':
          submitHelium(payments, tokenType)
          break
        case 'solana_dev':
          submitSolDev(payments, tokenType)
          break
      }
    },
    [l1Network, submitHelium, submitSolDev],
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
        case 'solana_dev':
          throw new Error('Solana not yet supported for ledger devices')
      }
    },
    [l1Network, submitHeliumLedger],
  )

  return {
    submit,
    submitLedger,
    data,
    error: accountError || submitError || nonceError,
    loading: accountLoading || submitLoading,
  }
}
