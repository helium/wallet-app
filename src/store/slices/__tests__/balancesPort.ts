import { AnchorProvider } from '@anchor-lang/core'
import { configureStore } from '@reduxjs/toolkit'
import { Cluster } from '@solana/web3.js'
import { PURGE } from 'redux-persist'
import { CSAccount } from '../../../storage/cloudStorage'
import { AccountBalance, Prices } from '../../../types/balance'
import reducer, {
  Tokens,
  balancesSlice,
  readBalanceHistory,
  readTokenPrices,
  syncTokenAccounts,
} from '../balancesSlice'

export type Outcome = 'fulfilled' | 'rejected'

// What the app asks of the balances layer. The tests drive only this port, so
// a move from the Redux slice to TanStack Query (or a Zustand store) swaps the
// adapter below and leaves every assertion unchanged.
export type BalancesPort = {
  syncTokenAccounts: (args: {
    cluster: Cluster
    acct: CSAccount
    anchorProvider: AnchorProvider
  }) => Promise<Outcome>
  isSyncing: () => boolean
  walletsOn: (cluster: Cluster) => Record<string, Tokens>
  tokensOf: (cluster: Cluster, solanaAddress: string) => Tokens | undefined
  updateSolBalance: (args: {
    cluster: Cluster
    solanaAddress: string
    balance: number
    tokenAccount: string
  }) => void
  updateTokenBalance: (args: {
    cluster: Cluster
    solanaAddress: string
    balance: number
    mint: string
    tokenAccount: string
  }) => void
  purge: () => void
  readTokenPrices: (currency: string) => Promise<Outcome>
  tokenPrices: () => Prices | undefined
  readBalanceHistory: (args: {
    currency: string
    cluster: Cluster
    solanaAddress: string
  }) => Promise<Outcome>
  balanceHistoryOf: (
    cluster: Cluster,
    solanaAddress: string,
  ) => Record<string, AccountBalance[]> | undefined
}

export const reduxBalancesPort = (): BalancesPort => {
  const store = configureStore({ reducer: { balances: reducer } })
  const state = () => store.getState().balances
  const outcome = async (
    dispatched: Promise<{ meta: { requestStatus: Outcome } }>,
  ) => (await dispatched).meta.requestStatus

  return {
    syncTokenAccounts: (args) =>
      outcome(store.dispatch(syncTokenAccounts(args))),
    isSyncing: () => state().balancesLoading === true,
    walletsOn: (cluster) => state().balances[cluster],
    tokensOf: (cluster, solanaAddress) =>
      state().balances[cluster][solanaAddress],
    updateSolBalance: (args) => {
      store.dispatch(balancesSlice.actions.updateBalance(args))
    },
    updateTokenBalance: (args) => {
      store.dispatch(balancesSlice.actions.updateAtaBalance(args))
    },
    purge: () => {
      store.dispatch({ type: PURGE })
    },
    readTokenPrices: (currency) =>
      outcome(store.dispatch(readTokenPrices({ currency }))),
    tokenPrices: () => state().tokenPrices,
    readBalanceHistory: (args) =>
      outcome(store.dispatch(readBalanceHistory(args))),
    balanceHistoryOf: (cluster, solanaAddress) =>
      state().balanceHistory[cluster][solanaAddress],
  }
}
