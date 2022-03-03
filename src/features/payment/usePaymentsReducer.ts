import { NetType } from '@helium/crypto-react-native'
import Balance, {
  CurrencyType,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { useReducer } from 'react'
import { decodeMemoString } from '../../components/MemoInput'
import { CSAccount } from '../../storage/AccountStorageProvider'
import { accountCurrencyType, accountNetType } from '../../utils/accountUtils'
import { Payment } from './PaymentItem'

type UpdatePayeeAction = {
  type: 'updatePayee'
  contact?: CSAccount
  address: string
  index: number
}

type UpdateMemoAction = {
  type: 'updateMemo'
  memo?: string
  index: number
}

type UpdateBalanceAction = {
  type: 'updateBalance'
  address?: string
  index: number
  value?: Balance<NetworkTokens | TestNetworkTokens>
}

type UpdatePayer = {
  type: 'updatePayer'
  address: string
}

type RemovePayment = {
  type: 'removePayment'
  index: number
}

type AddPayee = {
  type: 'addPayee'
}

type AddLinkedPayments = {
  type: 'addLinkedPayments'
  payments: Array<{
    address: string
    account: CSAccount | undefined
    amount: string | undefined
    memo: string | undefined
  }>
  payer?: string
}

export const MAX_PAYMENTS = 10

const initialState = {
  payments: [{}] as Array<Payment>,
  payer: '',
  netType: NetType.MAINNET,
  totalAmount: new Balance(0, CurrencyType.networkToken),
}

const paymentsSum = (
  payments: Payment[],
  currencyType: NetworkTokens | TestNetworkTokens,
) => {
  return payments.reduce((prev, current) => {
    if (!current.amount) {
      return prev
    }
    return prev.plus(current.amount)
  }, new Balance(0, currencyType))
}

function reducer(
  state: {
    payments: Array<Payment>
    payer: string
    totalAmount: Balance<TestNetworkTokens | NetworkTokens>
    netType: NetType.NetType
    error?: string
  },
  action:
    | UpdatePayeeAction
    | UpdateMemoAction
    | UpdateBalanceAction
    | UpdatePayer
    | AddPayee
    | AddLinkedPayments
    | RemovePayment,
) {
  switch (action.type) {
    case 'updatePayee': {
      // 1. If the contact exists, addresses should be equal
      const addressesNotEqual =
        action.contact?.address && action.address !== action.contact?.address

      // 2. Disallow multiple payments with the same address
      const duplicateAddress = state.payments.find(
        (p) => p.address === action.address,
      )

      // 3. Disallow self pay
      const selfPay = state.payer === action.address

      if (addressesNotEqual || duplicateAddress || selfPay) {
        return state
      }

      const { payments } = state
      const nextPayments = payments.map((p, index) => {
        if (index !== action.index) {
          return p
        }
        return {
          ...p,
          address: action.address,
          account: action.contact,
        }
      })
      return { ...state, payments: nextPayments }
    }
    case 'updateMemo': {
      const { payments } = state

      const nextPayments = payments.map((p, index) => {
        if (index !== action.index) {
          return p
        }
        return {
          ...p,
          memo: action.memo,
        }
      })
      return { ...state, payments: nextPayments }
    }
    case 'updateBalance': {
      const { payments } = state

      const nextPayments = payments.map((p, index) => {
        if (index !== action.index) {
          return p
        }
        return {
          ...p,
          amount: action.value,
        }
      })
      const currencyType = accountCurrencyType(state.payer)
      const totalAmount = paymentsSum(nextPayments, currencyType)
      return { ...state, totalAmount, payments: nextPayments }
    }
    case 'updatePayer': {
      const { payments, netType } = state
      const { address } = action
      const nextNetType = accountNetType(address)
      const currencyType = accountCurrencyType(address)
      let nextPayments = payments.filter((p) => p.address !== address)
      if (!nextPayments.length || nextNetType !== netType) {
        nextPayments = initialState.payments
      }

      const totalAmount = paymentsSum(nextPayments, currencyType)

      return {
        totalAmount,
        payments: nextPayments,
        payer: address,
        netType: nextNetType,
      }
    }
    case 'addPayee': {
      if (state.payments.length >= MAX_PAYMENTS) return state

      return { ...state, payments: [...state.payments, {}] }
    }
    case 'addLinkedPayments': {
      if (!action.payer && !action.payments.length) {
        return state
      }

      const address = action.payer || action.payments[0].address
      const nextNetType = accountNetType(address)
      const currencyType = accountCurrencyType(address)

      const nextPayments: Payment[] = action.payments.map((p) => ({
        address: p.address,
        account: p.account,
        memo: decodeMemoString(p.memo),
        amount: p.amount
          ? new Balance(parseInt(p.amount, 10), currencyType)
          : undefined,
      }))
      const totalAmount = paymentsSum(nextPayments, currencyType)

      return {
        ...state,
        payer: action.payer || '',
        payments: nextPayments,
        netType: nextNetType,
        totalAmount,
      }
    }
    case 'removePayment': {
      let nextPayments = state.payments.filter(
        (_p, index) => index !== action.index,
      )
      if (!nextPayments.length) {
        nextPayments = initialState.payments
      }
      return { ...state, payments: nextPayments }
    }
  }
}

export default () => useReducer(reducer, initialState)
