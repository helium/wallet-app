import { AnchorProvider } from '@coral-xyz/anchor'
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { AccountLayout, TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token'
import { Cluster, PublicKey } from '@solana/web3.js'
import { PURGE } from 'redux-persist'
import { CSAccount } from '../../storage/cloudStorage'
import { AccountBalance, Prices, TokenAccount } from '../../types/balance'
import { getBalanceHistory, getTokenPrices } from '../../utils/walletApiV2'

type BalanceHistoryByCurrency = Record<string, AccountBalance[]>
type BalanceHistoryByWallet = Record<string, BalanceHistoryByCurrency>
type BalanceHistoryByCluster = Record<Cluster, BalanceHistoryByWallet>

export type Tokens = {
  atas: TokenAccount[]
  sol: { tokenAccount: string; balance: number }
}

type AtaBalances = Record<Cluster, Record<string, Tokens>>

export type BalancesState = {
  balancesLoading?: boolean
  tokenPrices?: Prices
  balanceHistory: BalanceHistoryByCluster
  balances: AtaBalances
}

const initialState: BalancesState = {
  balances: {
    'mainnet-beta': {},
    devnet: {},
    testnet: {},
  },
  balanceHistory: {
    'mainnet-beta': {},
    devnet: {},
    testnet: {},
  },
}

export const syncTokenAccounts = createAsyncThunk(
  'balances/syncTokenAccounts',
  async ({
    cluster: _cluster,
    acct,
    anchorProvider,
  }: {
    cluster: Cluster
    acct: CSAccount
    anchorProvider: AnchorProvider
  }): Promise<Tokens> => {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    const pubKey = new PublicKey(acct.solanaAddress)
    const { connection } = anchorProvider

    const tokenAccounts = await connection.getTokenAccountsByOwner(pubKey, {
      programId: TOKEN_PROGRAM_ID,
    })

    const solAcct = await connection.getAccountInfo(pubKey)

    const atas = await Promise.all(
      tokenAccounts.value.map(async (tokenAccount) => {
        const accountData = AccountLayout.decode(tokenAccount.account.data)
        const { mint } = accountData
        const mintAcc = await getMint(connection, mint)

        return {
          tokenAccount: tokenAccount.pubkey.toBase58(),
          mint: mint.toBase58(),
          balance: Number(accountData.amount || 0),
          decimals: mintAcc.decimals,
        }
      }),
    )

    const solBalance = solAcct?.lamports || 0
    const sol = {
      tokenAccount: acct.solanaAddress,
      balance: solBalance,
    }

    return {
      atas,
      sol,
    }
  },
)

export const readTokenPrices = createAsyncThunk(
  'balances/readTokenPrices',
  async ({ currency }: { currency: string }) => {
    return getTokenPrices(currency)
  },
)

export const readBalanceHistory = createAsyncThunk(
  'balances/readBalanceHistory ',
  async ({
    currency,
    cluster,
    solanaAddress,
  }: {
    currency: string
    cluster: Cluster
    solanaAddress: string
  }) => {
    return getBalanceHistory({
      currency,
      solanaAddress,
      cluster,
    })
  },
)

const balancesSlice = createSlice({
  name: 'balances',
  initialState,
  reducers: {
    updateBalance: (
      state,
      action: PayloadAction<{
        cluster: Cluster
        solanaAddress: string
        balance: number
        tokenAccount: string
      }>,
    ) => {
      const { payload } = action
      const { cluster, solanaAddress, balance, tokenAccount } = payload
      const next = { tokenAccount, balance }
      const prevTokens = state.balances?.[cluster]?.[solanaAddress]
      if (!prevTokens) return

      prevTokens.sol = next
    },
    updateAtaBalance: (
      state,
      action: PayloadAction<{
        cluster: Cluster
        solanaAddress: string
        balance: number
        mint: string
        tokenAccount: string
      }>,
    ) => {
      const { payload } = action
      const { cluster, solanaAddress, balance } = payload
      const prevAtas = state.balances?.[cluster]?.[solanaAddress]?.atas || []
      const foundIndex = prevAtas.findIndex(
        ({ tokenAccount, mint }) =>
          tokenAccount === payload.tokenAccount && mint === payload.mint,
      )
      if (foundIndex !== -1) {
        const prev = prevAtas[foundIndex]
        prev.balance = balance
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(syncTokenAccounts.pending, (state) => {
      state.balancesLoading = true
    })
    builder.addCase(syncTokenAccounts.fulfilled, (state, action) => {
      const args = action.meta.arg
      const { payload } = action
      if (!args?.acct.solanaAddress || !args.cluster) return state
      const { solanaAddress } = args.acct
      const { cluster } = args
      state.balancesLoading = false

      state.balances[cluster][solanaAddress] = payload
    })
    builder.addCase(syncTokenAccounts.rejected, (state) => {
      state.balancesLoading = false
    })
    builder.addCase(readTokenPrices.fulfilled, (state, action) => {
      const { currency } = action.meta.arg
      if (!state.tokenPrices) {
        state.tokenPrices = {
          helium: {},
          solana: {},
          'helium-iot': {},
          'helium-mobile': {},
        } as Prices
      }
      state.tokenPrices.helium[currency] = action.payload.helium[currency]
      state.tokenPrices['helium-mobile'][currency] =
        action.payload['helium-mobile'][currency]
      state.tokenPrices['helium-iot'][currency] =
        action.payload['helium-iot'][currency]
      state.tokenPrices.solana[currency] = action.payload.solana[currency]
    })
    builder.addCase(readBalanceHistory.fulfilled, (state, action) => {
      const { cluster, solanaAddress: address, currency } = action.meta.arg
      const { payload } = action

      if (!state.balanceHistory[cluster][address]) {
        state.balanceHistory[cluster][address] = {}
      }

      state.balanceHistory[cluster][address][currency] = payload
    })
    builder.addCase(PURGE, () => initialState)
  },
})

const { reducer, name } = balancesSlice
export { balancesSlice, name }
export default reducer
