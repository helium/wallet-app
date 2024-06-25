import { NetTypes } from '@helium/address'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { useReducer } from 'react'
import { NATIVE_MINT } from '@solana/spl-token'
import { CSAccount } from '../../storage/cloudStorage'
import { TXN_FEE_IN_LAMPORTS } from '../../utils/solanaUtils'
import { Payment } from './PaymentItem'

type UpdatePayeeAction = {
  type: 'updatePayee'
  contact?: CSAccount
  address: string
  index: number
  payer: string
  createTokenAccountFee: BN
}

type UpdateBalanceAction = {
  type: 'updateBalance'
  address?: string
  index: number
  value?: BN
  max?: boolean
  payer: string
}

type UpdateTokenBalanceAction = {
  type: 'updateTokenBalance'
  balance?: BN
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

type ToggleMax = {
  type: 'toggleMax'
  index: number
}

type AddPayee = {
  type: 'addPayee'
}

type ChangeToken = {
  type: 'changeToken'
  mint: PublicKey
}

type AddLinkedPayments = {
  type: 'addLinkedPayments'
  payments: Array<{
    address: string
    account: CSAccount | undefined
    amount: string | undefined
  }>
}

export const MAX_PAYMENTS = 10

type PaymentState = {
  payments: Payment[]
  totalAmount: BN
  error?: string
  mint: PublicKey
  netType: NetTypes.NetType
  networkFee?: BN
  balance: BN
}

const initialState = (opts: {
  mint: PublicKey
  payments?: Payment[]
  netType: NetTypes.NetType
  balance?: BN
}): PaymentState => ({
  error: undefined,
  payments: [{}] as Array<Payment>,
  totalAmount: new BN(0),
  ...calculateFee([{}]),
  ...opts,
  balance: opts.balance || new BN(0),
})

const paymentsSum = (payments: Payment[]) => {
  return payments.reduce((prev, current) => {
    if (!current.amount) {
      return prev
    }
    return prev.add(current.amount)
  }, new BN(0))
}

const calculateFee = (payments: Payment[]) => {
  const totalFee = payments.reduce((prev, current) => {
    if (!current.createTokenAccountFee) {
      return prev
    }
    return prev.add(current.createTokenAccountFee)
  }, new BN(0))

  const txnFeeInLammportsFee = new BN(TXN_FEE_IN_LAMPORTS)
  const networkFee = totalFee.add(txnFeeInLammportsFee)

  return {
    networkFee,
  }
}

const recalculate = (payments: Payment[], state: PaymentState) => {
  const accountBalance = state.balance
  const { networkFee } = calculateFee(payments)
  const maxPayment = payments.find((p) => p.max)
  const totalAmount = paymentsSum(payments)

  if (!maxPayment) {
    return { networkFee, payments, totalAmount }
  }

  const prevPaymentAmount = maxPayment?.amount ?? new BN(0)
  const totalMinusPrevPayment = totalAmount.sub(prevPaymentAmount)
  let maxBalance = accountBalance?.sub(totalMinusPrevPayment)

  if (state.mint.equals(NATIVE_MINT)) {
    maxBalance = maxBalance?.sub(networkFee)
  }

  if (maxBalance.lt(new BN(0))) {
    maxBalance = new BN(0)
  }

  maxPayment.amount = maxBalance

  return {
    networkFee,
    payments,
    totalAmount: paymentsSum(payments),
  }
}

function reducer(
  state: PaymentState,
  action:
    | UpdatePayeeAction
    | UpdateBalanceAction
    | UpdateTokenBalanceAction
    | UpdateErrorAction
    | AddPayee
    | AddLinkedPayments
    | RemovePayment
    | ChangeToken
    | ToggleMax,
) {
  switch (action.type) {
    case 'updatePayee': {
      // 1. If the contact exists, addresses should be equal
      const contactAddress = action.contact?.solanaAddress

      const addressNotEqual =
        contactAddress && action.address !== contactAddress

      // 2. Disallow multiple payments with the same address
      const duplicateAddress = state.payments.find(
        (p) => p.address === action.address,
      )

      if (addressNotEqual || duplicateAddress) {
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
          createTokenAccountFee: action.createTokenAccountFee,
        }
      })
      return { ...state, ...recalculate(nextPayments, state) }
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
          max: action.max,
        }
      })
      return { ...state, ...recalculate(nextPayments, state) }
    }

    case 'updateTokenBalance': {
      return {
        ...state,
        balance: action.balance || new BN(0),
      }
    }
    case 'addPayee': {
      if (state.payments.length >= MAX_PAYMENTS) return state

      return { ...state, ...recalculate([...state.payments, {}], state) }
    }

    case 'changeToken': {
      const { payments } = state

      // When changing the token, we need to reset the payments but keep the payee
      const newPayments = payments.map((payment) => {
        return {
          ...payment,
          max: false,
          amount: undefined,
          hasError: undefined,
        }
      })

      return initialState({
        mint: action.mint,
        payments: newPayments,
        balance: state.balance,
        netType: state.netType,
      })
    }

    case 'addLinkedPayments': {
      if (!action.payments.length) {
        return initialState({
          mint: state.mint,
          balance: state.balance,
          netType: state.netType,
        })
      }

      const nextPayments: Payment[] = action.payments.map((p) => ({
        address: p.address,
        account: p.account,
        amount: p.amount ? new BN(parseInt(p.amount, 10)) : undefined,
        createTokenAccountFee: new BN(0),
      }))
      const totalAmount = paymentsSum(nextPayments)

      const fees = calculateFee(nextPayments)

      return {
        ...state,
        ...fees,
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
      return { ...state, ...recalculate(nextPayments, state) }
    }
    case 'toggleMax': {
      let { payments } = state

      const nextMax = !payments[action.index].max
      payments = payments.map((p, index) => {
        const isTarget = action.index === index
        const wasMax = p.max
        return {
          ...p,
          max: isTarget ? nextMax : false,
          amount: wasMax || (isTarget && !wasMax) ? undefined : p.amount,
        }
      })

      return { ...state, ...recalculate(payments, state) }
    }
  }
}

export default (opts: {
  netType: NetTypes.NetType
  mint: PublicKey
  balance?: BN
}) => useReducer(reducer, initialState(opts))
