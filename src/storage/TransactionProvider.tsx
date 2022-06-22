import Address from '@helium/address'
import Balance, {
  CurrencyType,
  DataCredits,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { PaymentV2, TokenBurnV1, Transaction } from '@helium/transactions'
import React, { createContext, ReactNode, useContext, useEffect } from 'react'
import { encodeMemoString } from '../components/MemoInput'
import { useAccountQuery, useTxnConfigVarsQuery } from '../generated/graphql'
import { useAccountStorage } from './AccountStorageProvider'
import { getKeypair } from './secureStorage'

export const EMPTY_B58_ADDRESS = Address.fromB58(
  '13PuqyWXzPYeXcF1B9ZRx7RLkEygeL374ZABiQdwRSNzASdA1sn',
)

export type SendDetails = {
  payee: string
  balanceAmount: Balance<NetworkTokens> | Balance<TestNetworkTokens>
  memo: string
}

const useTransactionHook = () => {
  const { currentAccount } = useAccountStorage()
  const { data: txnVarsData, error } = useTxnConfigVarsQuery({
    fetchPolicy: 'cache-and-network',
    variables: { address: currentAccount?.address || '' },
    skip: !currentAccount?.address,
  })

  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-only',
    skip: !currentAccount?.address,
  })

  useEffect(() => {
    if (!txnVarsData?.txnConfigVars) return

    Transaction.config(txnVarsData.txnConfigVars)
  }, [txnVarsData, error])

  const makeBurnTxn = async (opts: {
    amount: number
    payeeB58: string
    nonce: number
    memo: string
    dcPayloadSize?: number
    txnFeeMultiplier?: number
    shouldSign?: boolean
    payerB58?: string
  }) => {
    const {
      payeeB58,
      amount,
      nonce,
      memo,
      dcPayloadSize,
      txnFeeMultiplier,
      payerB58,
      shouldSign = true,
    } = opts
    if (!currentAccount?.address && !payerB58) {
      throw new Error('No account selected for payment')
    }

    const payee = Address.fromB58(payeeB58)

    if (dcPayloadSize && txnFeeMultiplier) {
      Transaction.config({ dcPayloadSize, txnFeeMultiplier })
    }

    const txn = new TokenBurnV1({
      payer: Address.fromB58(payerB58 || currentAccount?.address || ''),
      payee,
      amount,
      nonce,
      memo,
    })

    const txnJson = {
      type: txn.type,
      payee: txn.payee?.b58 || '',
      amount: txn.amount,
      payer: txn.payer?.b58,
      nonce: txn.nonce,
      fee: txn.fee,
      memo: txn.memo,
    }

    const keypair = await getKeypair(currentAccount?.address || '')

    if (!shouldSign || !keypair) {
      return { txnJson: JSON.stringify(txnJson), unsignedTxn: txn }
    }

    const signedTxn = await txn.sign({ payer: keypair })
    return { signedTxn, txnJson: JSON.stringify(txnJson), unsignedTxn: txn }
  }

  const makePaymentTxn = async (opts: {
    paymentDetails: Array<SendDetails>
    speculativeNonce: number
    isLedger?: boolean
  }): Promise<{
    txnJson: string
    signedTxn?: PaymentV2
    unsignedTxn: PaymentV2
  }> => {
    if (!currentAccount?.address) {
      throw new Error('No account selected for payment')
    }

    if (opts.isLedger && opts.paymentDetails.length > 1) {
      throw new Error(
        'Only one payee is allowed when paying with ledger account',
      )
    }

    const txn = new PaymentV2({
      payer: Address.fromB58(currentAccount.address),
      payments: opts.paymentDetails.map(
        ({ payee: address, balanceAmount, memo }) => ({
          payee: Address.fromB58(address),
          amount: balanceAmount.integerBalance,
          memo: encodeMemoString(memo),
        }),
      ),
      nonce: opts.speculativeNonce + 1,
    })

    const txnJson = {
      type: txn.type,
      payments: txn.payments.map((p) => ({
        payee: p.payee.b58,
        memo: p.memo,
        amount: p.amount,
      })),
      payer: txn.payer?.b58,
      nonce: txn.nonce,
      fee: txn.fee,
    }
    let signedTxn: PaymentV2 | undefined

    if (!opts.isLedger) {
      const keypair = await getKeypair(currentAccount?.address)
      if (keypair) {
        signedTxn = await txn.sign({ payer: keypair })
      }
    }
    return { signedTxn, txnJson: JSON.stringify(txnJson), unsignedTxn: txn }
  }

  const calculatePaymentTxnFee = async (paymentDetails: Array<SendDetails>) => {
    if (!currentAccount?.address) {
      throw new Error(
        'Cannot calculate payment txn fee. Current account not found',
      )
    }
    const payments = paymentDetails.map(
      ({ payee: address, balanceAmount, memo }) => ({
        // if a payee address isn't supplied, we use a dummy address
        payee:
          address && Address.isValid(address)
            ? Address.fromB58(address)
            : EMPTY_B58_ADDRESS,
        amount: balanceAmount.integerBalance,
        memo: encodeMemoString(memo),
      }),
    )
    const paymentTxn = new PaymentV2({
      payer: Address.fromB58(currentAccount.address),
      payments,
      nonce: (accountData?.account?.nonce || 0) + 1,
    })

    return new Balance(paymentTxn.fee || 0, CurrencyType.dataCredit)
  }

  return {
    makeBurnTxn,
    calculatePaymentTxnFee,
    makePaymentTxn,
  }
}

const initialState = {
  calculatePaymentTxnFee: () =>
    new Promise<Balance<DataCredits>>((resolve) =>
      resolve(new Balance(0, CurrencyType.dataCredit)),
    ),
  makeBurnTxn: () =>
    new Promise<{
      txnJson: string
      signedTxn?: TokenBurnV1
      unsignedTxn: TokenBurnV1
    }>((resolve) =>
      resolve({
        unsignedTxn: new TokenBurnV1({
          payer: EMPTY_B58_ADDRESS,
          payee: EMPTY_B58_ADDRESS,
          amount: 0,
          nonce: 0,
          memo: '',
        }),
        txnJson: '',
      }),
    ),
  makePaymentTxn: () =>
    new Promise<{
      txnJson: string
      signedTxn: PaymentV2
      unsignedTxn: PaymentV2
    }>((resolve) =>
      resolve({
        unsignedTxn: new PaymentV2({ payer: EMPTY_B58_ADDRESS, payments: [] }),
        signedTxn: new PaymentV2({ payer: EMPTY_B58_ADDRESS, payments: [] }),
        txnJson: '',
      }),
    ),
}

const TransactionContext =
  createContext<ReturnType<typeof useTransactionHook>>(initialState)
const { Provider } = TransactionContext

const TransactionProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useTransactionHook()}>{children}</Provider>
}

export const useTransactions = () => useContext(TransactionContext)

export default TransactionProvider
