import { Address } from '@helium/crypto-react-native'
import { TokenBurnV1, Transaction } from '@helium/transactions'
import React, { createContext, ReactNode, useContext, useEffect } from 'react'
import { useTxnConfigVarsQuery } from '../../generated/graphql'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

const EMPTY_B58_ADDRESS = Address.fromB58(
  '13PuqyWXzPYeXcF1B9ZRx7RLkEygeL374ZABiQdwRSNzASdA1sn',
)

const useTransactionHook = ({ clientReady }: { clientReady: boolean }) => {
  const { getKeypair } = useAccountStorage()
  const { data, error } = useTxnConfigVarsQuery({
    fetchPolicy: 'cache-and-network',
    skip: !clientReady,
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

  return { makeBurnTxn }
}

const initialState = {
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
