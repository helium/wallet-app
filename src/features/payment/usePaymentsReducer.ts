import Address, { NetTypes } from '@helium/address'
import Balance, {
  CurrencyType,
  DataCredits,
  IotTokens,
  MobileTokens,
  NetworkTokens,
  SolTokens,
  TestNetworkTokens,
  USDollars,
} from '@helium/currency'
import { PaymentV2 } from '@helium/transactions'
import BigNumber from 'bignumber.js'
import { useReducer } from 'react'
import { decodeMemoString } from '../../components/MemoInput'
import { CSAccount } from '../../storage/cloudStorage'
import { EMPTY_B58_ADDRESS } from '../../storage/TransactionProvider'
import { L1Network } from '../../utils/accountUtils'
import { TXN_FEE_IN_LAMPORTS } from '../../utils/solanaUtils'
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

type ToggleMax = {
  type: 'toggleMax'
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
  oraclePrice?: Balance<USDollars>
  netType: NetTypes.NetType
  l1Network: L1Network
  networkFee?: Balance<TestNetworkTokens | NetworkTokens | SolTokens>
  dcFee?: Balance<DataCredits>
  accountMobileBalance?: Balance<MobileTokens>
  accountIotBalance?: Balance<IotTokens>
  accountNetworkBalance?: Balance<TestNetworkTokens | NetworkTokens>
}

const initialState = (opts: {
  currencyType: PaymentCurrencyType
  payments?: Payment[]
  netType: NetTypes.NetType
  l1Network: L1Network
  oraclePrice?: Balance<USDollars>
  accountMobileBalance?: Balance<MobileTokens>
  accountIotBalance?: Balance<IotTokens>
  accountNetworkBalance?: Balance<TestNetworkTokens | NetworkTokens>
}): PaymentState => ({
  error: undefined,
  payments: [{}] as Array<Payment>,
  totalAmount: new Balance(0, opts.currencyType),
  ...calculateFee([{}], {
    currencyType: opts.currencyType,
    oraclePrice: opts.oraclePrice,
    netType: opts.netType,
    l1Network: opts.l1Network,
  }),
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

const calculateFee = (
  payments: Payment[],
  opts: {
    currencyType: PaymentCurrencyType
    oraclePrice?: Balance<USDollars>
    netType: NetTypes.NetType
    l1Network: L1Network
  },
) => {
  const { currencyType, oraclePrice, netType, l1Network } = opts
  if (l1Network === 'solana') {
    return {
      networkFee: new Balance(TXN_FEE_IN_LAMPORTS, CurrencyType.solTokens),
    }
  }

  const mapped = payments.map(({ amount: balanceAmount, address }) => ({
    payee:
      address && Address.isValid(address)
        ? Address.fromB58(address)
        : EMPTY_B58_ADDRESS,
    amount: balanceAmount?.integerBalance || 0,
    memo: '',
    tokenType: currencyType.ticker,
  }))
  const paymentTxn = new PaymentV2({
    payer: EMPTY_B58_ADDRESS,
    payments: mapped,
    nonce: 1,
  })

  const dcFee = new Balance(paymentTxn.fee || 0, CurrencyType.dataCredit)

  if (!oraclePrice) {
    return { dcFee, networkFee: undefined }
  }

  let networkFee =
    netType === NetTypes.TESTNET
      ? dcFee.toTestNetworkTokens(oraclePrice)
      : dcFee.toNetworkTokens(oraclePrice)

  networkFee = new Balance(
    networkFee.bigInteger
      .precision(
        networkFee.type.decimalPlaces.toNumber() - 1,
        BigNumber.ROUND_UP,
      )
      .toNumber(),
    networkFee.type,
  )
  return {
    dcFee,
    networkFee,
  }
}

const recalculate = (payments: Payment[], state: PaymentState) => {
  const accountBalance = getAccountBalance(state)
  const { networkFee, dcFee } = calculateFee(payments, state)

  const maxPayment = payments.find((p) => p.max)
  const totalAmount = paymentsSum(payments, state.currencyType)
  if (!maxPayment) {
    return { networkFee, dcFee, payments, totalAmount }
  }
  const prevPaymentAmount =
    maxPayment?.amount ?? new Balance(0, state.currencyType)

  const totalMinusPrevPayment = totalAmount.minus(prevPaymentAmount)
  let maxBalance = accountBalance?.minus(totalMinusPrevPayment)

  if (
    state.l1Network !== 'solana' &&
    state.currencyType.ticker !== CurrencyType.mobile.ticker &&
    networkFee
  ) {
    maxBalance = maxBalance?.minus(networkFee)
  }

  if ((maxBalance?.integerBalance ?? 0) < 0) {
    maxBalance = new Balance(0, state.currencyType)
  }

  maxPayment.amount = maxBalance

  return {
    networkFee,
    dcFee,
    payments,
    totalAmount: paymentsSum(payments, state.currencyType),
  }
}

const getAccountBalance = ({
  accountIotBalance,
  accountMobileBalance,
  accountNetworkBalance,
  currencyType,
}: PaymentState) => {
  if (currencyType.ticker === CurrencyType.iot.ticker) {
    return accountIotBalance
  }

  if (currencyType.ticker === CurrencyType.mobile.ticker) {
    return accountMobileBalance
  }

  return accountNetworkBalance
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
    | ChangeToken
    | ToggleMax,
) {
  switch (action.type) {
    case 'updatePayee': {
      // 1. If the contact exists, addresses should be equal
      const contactAddress =
        state.l1Network === 'helium'
          ? action.contact?.address
          : action.contact?.solanaAddress

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
        }
      })
      return { ...state, ...recalculate(nextPayments, state) }
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
          max: false,
        }
      })
      return { ...state, ...recalculate(nextPayments, state) }
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
          memo: undefined,
          hasError: undefined,
        }
      })

      return initialState({
        currencyType: action.currencyType,
        payments: newPayments,
        oraclePrice: state.oraclePrice,
        accountMobileBalance: state.accountMobileBalance,
        accountIotBalance: state.accountIotBalance,
        accountNetworkBalance: state.accountNetworkBalance,
        netType: state.netType,
        l1Network: state.l1Network,
      })
    }

    case 'addLinkedPayments': {
      if (!action.payments.length) {
        return initialState({
          currencyType: state.currencyType,
          oraclePrice: state.oraclePrice,
          accountMobileBalance: state.accountMobileBalance,
          accountIotBalance: state.accountIotBalance,
          accountNetworkBalance: state.accountNetworkBalance,
          netType: state.netType,
          l1Network: state.l1Network,
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

      const fees = calculateFee(nextPayments, state)

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
  l1Network: L1Network
  currencyType: PaymentCurrencyType
  oraclePrice?: Balance<USDollars>
  accountMobileBalance?: Balance<MobileTokens>
  accountIotBalance?: Balance<MobileTokens>
  accountNetworkBalance?: Balance<TestNetworkTokens | NetworkTokens>
}) => useReducer(reducer, initialState(opts))
