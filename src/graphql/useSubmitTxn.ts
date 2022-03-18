import { useCallback, useState } from 'react'
import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import { PaymentV1 } from '@helium/transactions'
import { useTransactions } from '../storage/TransactionProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAccountLazyQuery, useSubmitTxnMutation } from '../generated/graphql'

export default () => {
  const { makePaymentTxn } = useTransactions()
  const { currentAccount } = useAccountStorage()

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

  const submit = useCallback(
    async (
      payments: {
        payee: string
        balanceAmount: Balance<NetworkTokens | TestNetworkTokens>
        memo: string
      }[],
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

  const submitLedger = useCallback(
    async ({ txn, txnJson }: { txn: PaymentV1; txnJson: string }) => {
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
  return {
    submit,
    submitLedger,
    data,
    error: accountError || submitError || nonceError,
    loading: accountLoading || submitLoading,
  }
}
