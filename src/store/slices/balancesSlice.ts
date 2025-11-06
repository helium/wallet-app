import { AnchorProvider } from '@coral-xyz/anchor'
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Cluster, PublicKey } from '@solana/web3.js'
import { PURGE } from 'redux-persist'
import { CSAccount } from '../../storage/cloudStorage'
import { AccountBalance, Prices, TokenAccount } from '../../types/balance'
import { getBalanceHistory, getTokenPrices } from '../../utils/walletApiV2'
import { SyncGuard } from '../../utils/syncGuard'

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

// Global sync guard to prevent overlapping syncs from ANY source
const balancesSyncGuard = new SyncGuard()

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
    const syncKey = `${_cluster}-${acct.solanaAddress}`

    // Check if sync can proceed
    if (!balancesSyncGuard.canSync(syncKey)) {
      throw new Error('Sync already in progress or cooldown active')
    }

    balancesSyncGuard.startSync(syncKey)

    try {
      if (!acct?.solanaAddress) throw new Error('No solana account found')

      const pubKey = new PublicKey(acct.solanaAddress)
      const { connection } = anchorProvider

      const tokenAccounts = await connection.getTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID,
      })

      const solAcct = await connection.getAccountInfo(pubKey)

      // Decode all token account data first
      const tokenAccountsData = tokenAccounts.value.map((tokenAccount) => {
        const accountData = AccountLayout.decode(tokenAccount.account.data)
        return {
          pubkey: tokenAccount.pubkey,
          mint: accountData.mint,
          amount: accountData.amount,
        }
      })

      // Extract unique mints and batch fetch their info using getMultipleAccountsInfo
      // Cap at 100 accounts per request due to RPC limits
      const uniqueMints = [
        ...new Set(tokenAccountsData.map((ta) => ta.mint.toBase58())),
      ]
      const uniqueMintPubkeys = uniqueMints.map((mint) => new PublicKey(mint))

      // Batch requests in chunks of 100 to respect RPC limits
      const BATCH_SIZE = 100
      const mintInfos: { mint: string; decimals: number }[] = []

      for (let i = 0; i < uniqueMintPubkeys.length; i += BATCH_SIZE) {
        const batch = uniqueMintPubkeys.slice(i, i + BATCH_SIZE)
        const batchMints = uniqueMints.slice(i, i + BATCH_SIZE)

        try {
          const mintAccountInfos = await connection.getMultipleAccountsInfo(
            batch,
          )

          const batchMintInfos = batchMints.map((mintStr, index) => {
            try {
              const accountInfo = mintAccountInfos[index]
              if (accountInfo && accountInfo.data) {
                // Parse mint account data to get decimals (decimals is at offset 44)
                const decimals = accountInfo.data[44]
                return { mint: mintStr, decimals }
              }
              return { mint: mintStr, decimals: 0 }
            } catch (error) {
              console.warn(`Failed to parse mint info for ${mintStr}:`, error)
              return { mint: mintStr, decimals: 0 }
            }
          })

          mintInfos.push(...batchMintInfos)
        } catch (error) {
          console.warn(
            `Failed to fetch mint batch ${i}-${i + BATCH_SIZE}:`,
            error,
          )
          // Add fallback entries for this batch
          const fallbackInfos = batchMints.map((mint) => ({
            mint,
            decimals: 0,
          }))
          mintInfos.push(...fallbackInfos)
        }
      }

      // Create mint info lookup map
      const mintInfoMap = new Map(
        mintInfos.map((info) => [info.mint, info.decimals]),
      )

      // Build token accounts with batched mint info
      const atas: TokenAccount[] = tokenAccountsData.map(
        (tokenAccountData) => ({
          tokenAccount: tokenAccountData.pubkey.toBase58(),
          mint: tokenAccountData.mint.toBase58(),
          balance: Number(tokenAccountData.amount || 0),
          decimals: mintInfoMap.get(tokenAccountData.mint.toBase58()) || 0,
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
    } finally {
      balancesSyncGuard.endSync()
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
