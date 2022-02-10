import { Address } from '@helium/crypto-react-native'
import Balance, {
  CurrencyType,
  DataCredits,
  NetworkTokens,
} from '@helium/currency'
import { PaymentV2, TokenBurnV1, Transaction } from '@helium/transactions'
import React, { createContext, ReactNode, useContext, useEffect } from 'react'
import { encodeMemoString } from '../components/MemoInput'
import { useAccountQuery, useTxnConfigVarsQuery } from '../generated/graphql'
import { useAccountStorage } from './AccountStorageProvider'

export const EMPTY_B58_ADDRESS = Address.fromB58(
  '13PuqyWXzPYeXcF1B9ZRx7RLkEygeL374ZABiQdwRSNzASdA1sn',
)

export type SendDetails = {
  address: string
  balanceAmount: Balance<NetworkTokens>
  memo: string
}

const useTransactionHook = ({ clientReady }: { clientReady: boolean }) => {
  const { getKeypair, currentAccount } = useAccountStorage()
  const { data, error } = useTxnConfigVarsQuery({
    fetchPolicy: 'cache-and-network',
    skip: !clientReady,
  })

  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address || !clientReady,
  })

  useEffect(() => {
    if (!data?.txnConfigVars) return

    Transaction.config(data.txnConfigVars)
  }, [data, error])

  const makeBurnTxn = async ({
    payeeB58,
    amount,
    nonce,
    memo,
    dcPayloadSize,
    txnFeeMultiplier,
  }: {
    amount: number
    payeeB58: string
    nonce: number
    memo: string
    dcPayloadSize?: number
    txnFeeMultiplier?: number
  }) => {
    const keypair = await getKeypair()
    if (!keypair) throw new Error('missing keypair')
    const payee = Address.fromB58(payeeB58)

    if (dcPayloadSize && txnFeeMultiplier) {
      Transaction.config({ dcPayloadSize, txnFeeMultiplier })
    }

    const tokenBurnTxn = new TokenBurnV1({
      payer: keypair.address,
      payee,
      amount,
      nonce,
      memo,
    })

    return tokenBurnTxn.sign({ payer: keypair })
  }

  const makePaymentTxn = async (
    paymentDetails: Array<SendDetails>,
  ): Promise<PaymentV2> => {
    const keypair = await getKeypair()
    if (!keypair) throw new Error('missing keypair')
    const paymentTxn = new PaymentV2({
      payer: keypair.address,
      payments: paymentDetails.map(({ address, balanceAmount, memo }) => ({
        payee: Address.fromB58(address),
        amount: balanceAmount.integerBalance,
        memo: encodeMemoString(memo),
      })),
      nonce: (accountData?.account?.nonce || 0) + 1,
    })
    return paymentTxn.sign({ payer: keypair })
  }

  const calculatePaymentTxnFee = async (paymentDetails: Array<SendDetails>) => {
    if (!currentAccount?.address) {
      throw new Error(
        'Cannot calculate payment txn fee. Current account not found',
      )
    }
    const paymentTxn = new PaymentV2({
      payer: Address.fromB58(currentAccount.address),
      payments: paymentDetails.map(({ address, balanceAmount, memo }) => ({
        // if a payee address isn't supplied, we use a dummy address
        payee:
          address && Address.isValid(address)
            ? Address.fromB58(address)
            : EMPTY_B58_ADDRESS,
        amount: balanceAmount.integerBalance,
        memo: encodeMemoString(memo),
      })),
      nonce: (accountData?.account?.nonce || 0) + 1,
    })

    return new Balance(paymentTxn.fee || 0, CurrencyType.dataCredit)
  }

  return { makeBurnTxn, calculatePaymentTxnFee, makePaymentTxn }
}

const initialState = {
  calculatePaymentTxnFee: () =>
    new Promise<Balance<DataCredits>>((resolve) =>
      resolve(new Balance(0, CurrencyType.dataCredit)),
    ),
  makeBurnTxn: () =>
    new Promise<TokenBurnV1>((resolve) =>
      resolve(
        new TokenBurnV1({
          payer: EMPTY_B58_ADDRESS,
          payee: EMPTY_B58_ADDRESS,
          amount: 0,
          nonce: 0,
          memo: '',
        }),
      ),
    ),
  makePaymentTxn: () =>
    new Promise<PaymentV2>((resolve) =>
      resolve(new PaymentV2({ payer: EMPTY_B58_ADDRESS, payments: [] })),
    ),
}

const TransactionContext =
  createContext<ReturnType<typeof useTransactionHook>>(initialState)
const { Provider } = TransactionContext

const TransactionProvider = ({
  children,
  clientReady,
}: {
  children: ReactNode
  clientReady: boolean
}) => {
  return (
    <Provider value={useTransactionHook({ clientReady })}>{children}</Provider>
  )
}

export const useTransactions = () => useContext(TransactionContext)

export default TransactionProvider
