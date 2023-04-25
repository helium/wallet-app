import { AnchorProvider } from '@coral-xyz/anchor'
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { Cluster } from '@solana/web3.js'
import { CSAccount } from '../../storage/cloudStorage'
import { Balances } from '../../types/solana'
import * as solUtils from '../../utils/solanaUtils'
import { getTokenPrices } from '../../utils/walletApi'
import { Prices } from '../../types/balance'

type BalancesByWallet = Record<string, Balances>
type BalancesByCluster = Record<Cluster, BalancesByWallet>

export type BalancesState = {
  tokens: BalancesByCluster
  balancesLoading?: boolean
  tokenPrices?: Prices
}

const initialBalances = {
  sol: { balance: 0, tokenAccount: '' },
  mobile: { balance: 0, tokenAccount: '' },
  dc: { balance: 0, tokenAccount: '' },
  iot: { balance: 0, tokenAccount: '' },
  hnt: { balance: 0, tokenAccount: '' },
}

const initialState: BalancesState = {
  tokens: {
    'mainnet-beta': {},
    devnet: {},
    testnet: {},
  },
}

export const readTokenBalances = createAsyncThunk(
  'balances/readTokenBalances',
  async ({
    cluster: _cluster,
    acct,
    anchorProvider,
  }: {
    cluster: Cluster
    acct: CSAccount
    anchorProvider: AnchorProvider
  }) => {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    return solUtils.readAccountBalances(anchorProvider, acct.solanaAddress)
  },
)

export const readTokenPrices = createAsyncThunk(
  'balances/readTokenPrices',
  async ({ currency }: { currency: string }) => {
    return getTokenPrices(currency)
  },
)

const balancesSlice = createSlice({
  name: 'balances',
  initialState,
  reducers: {
    updateTokenBalance: (
      state,
      action: PayloadAction<{
        cluster: Cluster
        solanaAddress: string
        balance: number
        type: 'sol' | 'mobile' | 'dc' | 'iot' | 'hnt'
      }>,
    ) => {
      const { cluster, solanaAddress, type, balance } = action.payload
      if (!state.tokens[cluster][solanaAddress]) {
        state.tokens[cluster][solanaAddress] = initialBalances
      }

      const prev = state.tokens[cluster][solanaAddress][type]

      state.tokens[cluster][solanaAddress][type] = {
        ...prev,
        balance,
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(readTokenBalances.pending, (state, action) => {
      const args = action.meta.arg
      if (!args?.acct.solanaAddress || !args.cluster) return state
      const { solanaAddress } = args.acct
      const { cluster } = args
      const prev = state.tokens[cluster][solanaAddress] || {}
      state.tokens[cluster][solanaAddress] = {
        ...prev,
      }
      state.balancesLoading = true
    })
    builder.addCase(readTokenBalances.fulfilled, (state, action) => {
      const args = action.meta.arg
      if (!args?.acct.solanaAddress || !args.cluster) return state
      const { solanaAddress } = args.acct
      const { cluster } = args
      const { payload } = action
      state.tokens[cluster][solanaAddress] = {
        ...payload,
      }
      state.balancesLoading = false
    })
    builder.addCase(readTokenBalances.rejected, (state, action) => {
      const args = action.meta.arg
      if (!args?.acct.solanaAddress || !args.cluster) return state
      const { solanaAddress } = args.acct
      const { cluster } = args
      const prev = state.tokens[cluster][solanaAddress] || {}
      state.tokens[cluster][solanaAddress] = {
        ...prev,
      }
      state.balancesLoading = false
    })
    builder.addCase(readTokenPrices.fulfilled, (state, action) => {
      if (!state.tokenPrices) {
        state.tokenPrices = {} as Prices
      }
      const { currency } = action.meta.arg
      state.tokenPrices.helium[currency] = action.payload.helium[currency]
      state.tokenPrices['helium-mobile'][currency] =
        action.payload['helium-mobile'][currency]
      state.tokenPrices['helium-iot'][currency] =
        action.payload['helium-iot'][currency]
      state.tokenPrices.solana[currency] = action.payload.solana[currency]
    })
  },
})

const { reducer, name } = balancesSlice
export { name, balancesSlice }
export default reducer
