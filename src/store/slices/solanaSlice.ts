import Balance, { AnyCurrencyType } from '@helium/currency'
import {
  createAsyncThunk,
  createSlice,
  SerializedError,
} from '@reduxjs/toolkit'
import { SignaturesForAddressOptions } from '@solana/web3.js'
import { first, last } from 'lodash'
import { CSAccount } from '../../storage/cloudStorage'
import { Activity, TokenType } from '../../types/activity'
import * as solUtils from '../../utils/solanaUtils'
import walletRestApi from './walletRestApi'

type Balances = {
  hntBalance?: bigint
  dcBalance?: bigint
  mobileBalance?: bigint
  secBalance?: bigint
  solBalance?: number
  stakedBalance?: bigint
  loading?: boolean
}

type TokenActivity = Record<TokenType, Activity[]>

type SolActivity = {
  all: TokenActivity
  payment: TokenActivity
}

export type SolanaState = {
  balances: Record<string, Balances>
  payment?: { loading?: boolean; error?: SerializedError; success?: boolean }
  activity: {
    loading?: boolean
    data: Record<string, SolActivity>
    error?: SerializedError
  }
}

const initialState: SolanaState = { balances: {}, activity: { data: {} } }

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
  async ({ account, payments }: PaymentInput, { dispatch }) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    const transfer = await solUtils.transferToken(
      account.solanaAddress,
      account.address,
      payments,
    )

    return dispatch(
      walletRestApi.endpoints.postPayment.initiate({
        txnSignature: transfer.signature,
        cluster: 'devnet',
      }),
    )
  },
)

export const getTxns = createAsyncThunk(
  'solana/getTxns',
  async (
    {
      account,
      tokenType,
      requestType,
    }: {
      account: CSAccount
      tokenType: TokenType
      requestType: 'update_head' | 'start_fresh' | 'fetch_more'
    },
    { getState },
  ) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    const options: SignaturesForAddressOptions = {
      limit: 20,
    }

    const { solana } = (await getState()) as {
      solana: SolanaState
    }
    const existing =
      solana.activity.data[account.solanaAddress]?.all?.[tokenType]

    if (requestType === 'fetch_more') {
      const lastActivity = last(existing)
      if (!lastActivity) {
        throw new Error("Can't fetch more")
      }
      options.before = lastActivity.hash
    } else if (requestType === 'update_head') {
      const firstActvity = first(existing)
      if (!firstActvity) {
        throw new Error("Can't update head")
      }

      options.until = firstActvity.hash
    }

    return solUtils.getTransactions(account.solanaAddress, tokenType, options)
  },
)

const solanaSlice = createSlice({
  name: 'solana',
  initialState,
  reducers: {
    resetPayment: (state) => {
      state.payment = { success: false, loading: false, error: undefined }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(readBalances.pending, (state, action) => {
      if (!action.meta.arg?.solanaAddress) return state
      const prev = state.balances[action.meta.arg?.solanaAddress] || {}

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
      const prev = state.balances[action.meta.arg?.solanaAddress] || {}
      state.balances[action.meta.arg?.solanaAddress] = {
        ...prev,
        loading: false,
      }
    })
    builder.addCase(makePayment.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(makePayment.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(makePayment.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(getTxns.pending, (state, _action) => {
      state.activity.loading = true
      state.activity.error = undefined
    })
    builder.addCase(getTxns.fulfilled, (state, { meta, payload }) => {
      if (!meta.arg.account.solanaAddress) return

      const {
        tokenType,
        account: { solanaAddress: address },
        requestType,
      } = meta.arg

      state.activity.loading = false
      state.activity.error = undefined

      state.activity = state.activity || {}
      state.activity.data = state.activity.data || {}
      state.activity.data[address] = state.activity.data[address] || {
        all: {},
        payment: {},
      }

      const prevAll = state.activity.data[address].all[tokenType]
      const prevPayment = state.activity.data[address].payment[tokenType]

      switch (requestType) {
        case 'start_fresh': {
          state.activity.data[address].all[tokenType] = payload
          state.activity.data[address].payment[tokenType] = payload
          break
        }
        case 'fetch_more': {
          state.activity.data[address].all[tokenType] = [...prevAll, ...payload]
          state.activity.data[address].payment[tokenType] = [
            ...prevPayment,
            ...payload,
          ]
          break
        }
        case 'update_head': {
          state.activity.data[address].all[tokenType] = [...payload, ...prevAll]
          state.activity.data[address].payment[tokenType] = [
            ...payload,
            ...prevPayment,
          ]
          break
        }
      }
    })
    builder.addCase(getTxns.rejected, (state, { error, meta }) => {
      state.activity.loading = false

      // Only store the error if it was a fresh load
      if (meta.arg.requestType === 'start_fresh') {
        state.activity.error = error
      }
    })
  },
})

const { reducer, name } = solanaSlice
export { name, solanaSlice }
export default reducer
