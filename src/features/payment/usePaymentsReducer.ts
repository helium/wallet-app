import Balance, {
  IotTokens,
  MobileTokens,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { useReducer } from 'react'
import { decodeMemoString } from '../../components/MemoInput'
import { CSAccount } from '../../storage/cloudStorage'
import { Payment } from './PaymentItem'

type PaymentCurrencyType =
  | NetworkTokens
  | TestNetworkTokens
  | IotTokens
  | MobileTokens

type UpdatePayeeAction = {
  type: 'updatePayee'
  contact?: CSAccount
  address: string
  index: number
  payer: string
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
  value?: Balance<PaymentCurrencyType>
  payer: string
}

type RemovePayment = {
  type: 'removePayment'
  index: number
}

type UpdateErrorAction = {
  type: 'updateError'
  hasError: boolean
  index: number
}

type AddPayee = {
  type: 'addPayee'
}

type ChangeToken = {
  type: 'changeToken'
  currencyType: PaymentCurrencyType
}

type AddLinkedPayments = {
  type: 'addLinkedPayments'
  payments: Array<{
    address: string
    account: CSAccount | undefined
    amount: string | undefined
    memo: string | undefined
  }>
}

export const MAX_PAYMENTS = 10

type PaymentState = {
  payments: Payment[]
  totalAmount: Balance<PaymentCurrencyType>
  error?: string
  currencyType: PaymentCurrencyType
}

const initialState = (opts: {
  currencyType: PaymentCurrencyType
  payments?: Payment[]
}): PaymentState => ({
  error: undefined,
  payments: [{}] as Array<Payment>,
  totalAmount: new Balance(0, opts.currencyType),
  ...opts,
})

const paymentsSum = (payments: Payment[], type: PaymentCurrencyType) => {
  return payments.reduce((prev, current) => {
    if (!current.amount) {
      return prev
    }
    return prev.plus(current.amount)
  }, new Balance(0, type))
}

function reducer(
  state: PaymentState,
  action:
    | UpdatePayeeAction
    | UpdateMemoAction
    | UpdateBalanceAction
    | UpdateErrorAction
    | AddPayee
    | AddLinkedPayments
    | RemovePayment
    | ChangeToken,
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

      if (addressesNotEqual || duplicateAddress) {
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
    case 'updateError': {
      const { payments } = state

      const nextPayments = payments.map((p, index) => {
        if (index !== action.index) {
          return p
        }
        return {
          ...p,
          hasError: action.hasError,
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
      const totalAmount = paymentsSum(nextPayments, state.currencyType)
      return { ...state, totalAmount, payments: nextPayments }
    }
    case 'addPayee': {
      if (state.payments.length >= MAX_PAYMENTS) return state

      return { ...state, payments: [...state.payments, {}] }
    }

    case 'changeToken': {
      const { payments } = state

      // When changing the token, we need to reset the payments but keep the payee
      const newPayments = payments.map((payment) => {
        return {
          ...payment,
          amount: undefined,
          memo: undefined,
          hasError: undefined,
        }
      })

      return initialState({
        currencyType: action.currencyType,
        payments: newPayments,
      })
    }

    case 'addLinkedPayments': {
      if (!action.payments.length) {
        return initialState({
          currencyType: state.currencyType,
        })
      }

      const nextPayments: Payment[] = action.payments.map((p) => ({
        address: p.address,
        account: p.account,
        memo: decodeMemoString(p.memo),
        amount: p.amount
          ? new Balance(parseInt(p.amount, 10), state.currencyType)
          : undefined,
      }))
      const totalAmount = paymentsSum(nextPayments, state.currencyType)

      return {
        ...state,
        payments: nextPayments,
        totalAmount,
      }
    }
    case 'removePayment': {
      let nextPayments = state.payments.filter(
        (_p, index) => index !== action.index,
      )
      if (!nextPayments.length) {
        nextPayments = []
      }
      const totalAmount = paymentsSum(nextPayments, state.currencyType)
      return { ...state, payments: nextPayments, totalAmount }
    }
  }
}

export default (opts: { currencyType: PaymentCurrencyType }) =>
  useReducer(reducer, initialState(opts))
