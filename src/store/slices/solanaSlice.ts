import Balance, { AnyCurrencyType } from '@helium/currency'
import {
  createAsyncThunk,
  createSlice,
  SerializedError,
} from '@reduxjs/toolkit'
import { CSAccount } from '../../storage/cloudStorage'
import { Activity, TokenType } from '../../types/activity'
import * as solUtils from '../../utils/solanaUtils'

type Balances = {
  hntBalance?: bigint
  dcBalance?: bigint
  mobileBalance?: bigint
  secBalance?: bigint
  solBalance?: number
  stakedBalance?: bigint
  loading?: boolean
}

type SolActivity = {
  all: Activity[]
  payment: Activity[]
}
export type SolanaState = {
  balances: Record<string, Balances>
  payment?: { loading?: boolean; error?: SerializedError; success?: boolean }
  activities: {
    loading?: boolean
    data: Record<string, SolActivity>
    error?: SerializedError
  }
}
const initialPaymentState = {
  loading: false,
  error: undefined,
  success: undefined,
}
const initialState: SolanaState = { balances: {}, activities: { data: {} } }

export const readBalances = createAsyncThunk(
  'solana/readBalance',
  async (acct: CSAccount) => {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    const heliumBals = await solUtils.readHeliumBalances(acct.solanaAddress)
    const solBalance = await solUtils.readSolanaBalance(acct.solanaAddress)

    if (solBalance === 0) {
      // TODO: REMOVE FOR MAINNET - How do those wallets get funded?
      solUtils.airdrop(acct.solanaAddress)
    }
    return { ...heliumBals, solBalance }
  },
)

type Payment = {
  payee: string
  balanceAmount: Balance<AnyCurrencyType>
  memo: string
  max?: boolean
}

type PaymentInput = { account: CSAccount; payments: Payment[] }

export const makePayment = createAsyncThunk(
  'solana/makePayment',
  async ({ account, payments }: PaymentInput) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    return solUtils.transferToken(
      account.solanaAddress,
      account.address,
      payments,
    )
  },
)

export const getTxns = createAsyncThunk(
  'solana/getTxns',
  async ({
    account,
    tokenType,
  }: {
    account: CSAccount
    tokenType: TokenType
  }) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    return solUtils.getTransactions(account.solanaAddress, tokenType)
  },
)

const solanaSlice = createSlice({
  name: 'solana',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(readBalances.pending, (state, action) => {
      if (!action.meta.arg?.solanaAddress) return state
      const prev =
        state.balances[action.meta.arg?.solanaAddress] || initialPaymentState

      state.balances[action.meta.arg?.solanaAddress] = {
        ...prev,
        loading: true,
      }
    })
    builder.addCase(readBalances.fulfilled, (state, action) => {
      if (!action.meta.arg?.solanaAddress) return state
      state.balances[action.meta.arg?.solanaAddress] = {
        ...action.payload,
        loading: false,
      }
    })
    builder.addCase(readBalances.rejected, (state, action) => {
      if (!action.meta.arg?.solanaAddress) return state
      const prev =
        state.balances[action.meta.arg?.solanaAddress] || initialPaymentState
      state.balances[action.meta.arg?.solanaAddress] = {
        ...prev,
        loading: false,
      }
    })
    builder.addCase(makePayment.pending, (state, _action) => {
      state.payment = initialPaymentState
      state.payment.success = undefined
      state.payment.loading = true
      state.payment.error = undefined
    })
    builder.addCase(makePayment.fulfilled, (state, _action) => {
      state.payment = initialPaymentState
      state.payment.success = true
      state.payment.loading = false
      state.payment.error = undefined
    })
    builder.addCase(makePayment.rejected, (state, action) => {
      state.payment = initialPaymentState
      state.payment.success = false
      state.payment.loading = false
      state.payment.error = action.error
    })
    builder.addCase(getTxns.pending, (state, _action) => {
      state.activities.loading = true
      state.activities.error = undefined
    })
    builder.addCase(getTxns.fulfilled, (state, action) => {
      state.activities.loading = false
      state.activities.error = undefined
      if (!action.meta.arg.account.solanaAddress) return

      state.activities = state.activities || {}
      state.activities.data = state.activities.data || {}
      const nextData =
        state.activities.data[action.meta.arg.account.solanaAddress] || {}

      // TODO: sort into filters
      nextData.all = action.payload
      nextData.payment = action.payload

      state.activities.data[action.meta.arg.account.solanaAddress] = nextData

      // const  =activities.data[action.meta.arg.account.solanaAddress]
      // data.all = action.payload
      // data.payment = action.payload
    })
    builder.addCase(getTxns.rejected, (state, action) => {
      state.activities.loading = false
      state.activities.error = action.error
    })
  },
})

const { reducer, name } = solanaSlice
export { name, solanaSlice }
export default reducer
