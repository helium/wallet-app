/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { AnchorProvider } from '@coral-xyz/anchor'
import {
  PayloadAction,
  SerializedError,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit'
import {
  Cluster,
  SignaturesForAddressOptions,
} from '@solana/web3.js'
import { first, last } from 'lodash'
import { PURGE } from 'redux-persist'
import { CSAccount } from '../../storage/cloudStorage'
import { Activity } from '../../types/activity'
import * as solUtils from '../../utils/solanaUtils'

type TokenActivity = Record<string, Activity[]>

type SolActivity = {
  all: TokenActivity
  payment: TokenActivity
  delegate: TokenActivity
  mint: TokenActivity
}

export type SolanaState = {
  payment?: {
    loading?: boolean
    error?: SerializedError
    success?: boolean
    signature?: string
    progress?: { percent: number; text: string } // 0-100
  }
  activity: {
    loading?: boolean
    data: Record<string, SolActivity>
    error?: SerializedError
  }
  delegate?: { loading?: boolean; error?: SerializedError; success?: boolean }
}

const initialState: SolanaState = {
  activity: { data: {} },
}

export const getTxns = createAsyncThunk(
  'solana/getTxns',
  async (
    {
      account,
      anchorProvider,
      mint,
      requestType,
    }: {
      account: CSAccount
      anchorProvider: AnchorProvider
      mint: string
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

    const existing = solana.activity.data[account.solanaAddress]?.all?.[mint]

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

    return solUtils.getTransactions(
      anchorProvider,
      account.solanaAddress,
      mint,
      options,
    )
  },
)

const solanaSlice = createSlice({
  name: 'solana',
  initialState,
  reducers: {
    setPaymentProgress: (
      state,
      action: PayloadAction<{ percent: number; text: string }>,
    ) => {
      if (state.payment) {
        state.payment.progress = action.payload
      }
    },
    resetPayment: (state) => {
      state.payment = {
        success: false,
        loading: false,
        error: undefined,
        signature: undefined,
        progress: undefined,
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getTxns.pending, (state, _action) => {
      state.activity.loading = true
      state.activity.error = undefined
    })
    builder.addCase(getTxns.fulfilled, (state, { meta, payload }) => {
      if (!meta.arg.account.solanaAddress) return

      const {
        mint,
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
        delegate: {},
        mint: {},
      }

      if (!state.activity.data[address].delegate) {
        state.activity.data[address].delegate = state.activity.data[address].all
      }

      if (!state.activity.data[address].mint) {
        state.activity.data[address].mint = state.activity.data[address].all
      }
      const prevAll = state.activity.data[address].all[mint]
      const prevPayment = state.activity.data[address].payment[mint]
      const prevDelegate = state.activity.data[address].delegate[mint]
      const prevMint = state.activity.data[address].mint[mint]

      switch (requestType) {
        case 'start_fresh': {
          state.activity.data[address].all[mint] = payload
          state.activity.data[address].payment[mint] = payload
          state.activity.data[address].delegate[mint] = payload
          state.activity.data[address].mint[mint] = payload
          break
        }
        case 'fetch_more': {
          state.activity.data[address].all[mint] = [...prevAll, ...payload]
          state.activity.data[address].payment[mint] = [
            ...prevPayment,
            ...payload,
          ]
          state.activity.data[address].delegate[mint] = [
            ...prevDelegate,
            ...payload,
          ]
          state.activity.data[address].mint[mint] = [
            ...prevDelegate,
            ...payload,
          ]
          break
        }
        case 'update_head': {
          state.activity.data[address].all[mint] = [...payload, ...prevAll]
          state.activity.data[address].payment[mint] = [
            ...payload,
            ...prevPayment,
          ]
          state.activity.data[address].delegate[mint] = [
            ...payload,
            ...prevDelegate,
          ]
          state.activity.data[address].mint[mint] = [...payload, ...prevMint]
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
    builder.addCase(PURGE, () => initialState)
  },
})

const { reducer, name } = solanaSlice
export { name, solanaSlice }
export default reducer
