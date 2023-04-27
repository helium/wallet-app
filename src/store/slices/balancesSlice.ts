import { AnchorProvider } from '@coral-xyz/anchor'
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { Cluster, PublicKey } from '@solana/web3.js'
import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { CSAccount } from '../../storage/cloudStorage'
import { getBalanceHistory, getTokenPrices } from '../../utils/walletApiV2'
import { AccountBalance, Prices } from '../../types/balance'
import { getEscrowTokenAccount } from '../../utils/solanaUtils'

type BalanceHistoryByCurrency = Record<string, AccountBalance[]>
type BalanceHistoryByWallet = Record<string, BalanceHistoryByCurrency>
type BalanceHistoryByCluster = Record<Cluster, BalanceHistoryByWallet>

export type TokenAccount = {
  tokenAccount?: string
  mint: string
  balance: bigint
}
export type Tokens = {
  atas: TokenAccount[]
  sol: { tokenAccount: string; balance: bigint }
  dcEscrow: { tokenAccount: string; balance: bigint }
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

    const supportedMints = [IOT_MINT, MOBILE_MINT, DC_MINT, HNT_MINT]
    const tokenAccounts = await connection.getTokenAccountsByOwner(pubKey, {
      programId: TOKEN_PROGRAM_ID,
    })

    const decoded = tokenAccounts.value.map((tokenAccount) => {
      const accountData = AccountLayout.decode(tokenAccount.account.data)
      const { mint } = accountData

      return {
        tokenAccount: tokenAccount.pubkey,
        mint,
        balance: accountData.amount,
      }
    })

    const atas = supportedMints.map((mint) => {
      const found = decoded.find((d) => d.mint.equals(mint))

      return {
        tokenAccount: found?.tokenAccount.toBase58(),
        mint: mint.toBase58(),
        balance: found?.balance || 0n,
      }
    })

    const escrowAccount = getEscrowTokenAccount(acct.solanaAddress)
    let escrowBalance = 0n
    try {
      const dcEscrowBalance = await connection.getTokenAccountBalance(
        escrowAccount,
      )
      escrowBalance = BigInt(dcEscrowBalance.value.amount)
    } catch {}

    const dcEscrow = {
      tokenAccount: escrowAccount.toBase58(),
      balance: escrowBalance,
    }

    const solBalance = await connection.getBalance(pubKey)
    const sol = {
      tokenAccount: acct.solanaAddress,
      balance: BigInt(solBalance),
    }

    return {
      atas,
      dcEscrow,
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
        balance: bigint
        type: 'dcEscrow' | 'sol'
        tokenAccount: string
      }>,
    ) => {
      const { payload } = action
      const { cluster, solanaAddress, balance, type, tokenAccount } = payload
      const next = { tokenAccount, balance }
      const prevTokens = state.balances[cluster][solanaAddress]
      switch (type) {
        case 'dcEscrow':
          prevTokens.dcEscrow = next
          break
        case 'sol':
          prevTokens.sol = next
          break
      }
      // TODO: verify this updates the state
    },
    updateAtaBalance: (
      state,
      action: PayloadAction<{
        cluster: Cluster
        solanaAddress: string
        balance: bigint
        mint: string
        tokenAccount: string
      }>,
    ) => {
      const { payload } = action
      const { cluster, solanaAddress, balance } = payload
      const prevAtas = state.balances[cluster]?.[solanaAddress].atas
      const foundIndex = prevAtas.findIndex(
        ({ tokenAccount, mint }) =>
          tokenAccount === payload.tokenAccount && mint === payload.mint,
      )
      if (foundIndex !== -1) {
        const prev = prevAtas[foundIndex]
        prev.balance = balance
        // TODO: Verify this updates the state
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
  },
})

const { reducer, name } = balancesSlice
export { name, balancesSlice }
export default reducer
