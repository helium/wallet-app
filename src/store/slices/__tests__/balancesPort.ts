import { AnchorProvider } from '@anchor-lang/core'
import { Cluster } from '@solana/web3.js'
import { CSAccount } from '../../../storage/cloudStorage'
import { AccountBalance, Prices } from '../../../types/balance'
import {
  BALANCE_HISTORY_QUERY_KEY,
  TOKEN_ACCOUNTS_QUERY_KEY,
  TOKEN_PRICES_QUERY_KEY,
  Tokens,
  balanceHistoryQueryOptions,
  syncTokenAccounts,
  tokenAccountsQueryOptions,
  tokenPricesQueryOptions,
  updateSolBalance,
  updateTokenBalance,
} from '../../../utils/balances'
import { createQueryClient } from '../../../utils/queryClient'

export type Outcome = 'fulfilled' | 'rejected'

// What the app asks of the balances layer. The tests drive only this port, so
// a move from TanStack Query to another store swaps the adapter below and
// leaves every assertion unchanged.
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

const outcome = (read: Promise<unknown>): Promise<Outcome> =>
  read.then(
    () => 'fulfilled',
    () => 'rejected',
  )

// The cached entries under a key prefix, by the key part after the prefix
const entriesUnder = <T>(
  client: ReturnType<typeof createQueryClient>,
  prefix: readonly unknown[],
) =>
  client
    .getQueriesData<T>({ queryKey: prefix })
    .filter((entry): entry is [readonly unknown[], T] => !!entry[1])
    .map(([key, data]) => [key[prefix.length] as string, data] as const)

export const tanstackBalancesPort = (): BalancesPort => {
  const client = createQueryClient()

  return {
    syncTokenAccounts: (args) => outcome(syncTokenAccounts(client, args)),
    isSyncing: () =>
      client.isFetching({ queryKey: TOKEN_ACCOUNTS_QUERY_KEY }) > 0,
    walletsOn: (cluster) =>
      Object.fromEntries(
        entriesUnder<Tokens>(client, [...TOKEN_ACCOUNTS_QUERY_KEY, cluster]),
      ),
    tokensOf: (cluster, solanaAddress) =>
      client.getQueryData(
        tokenAccountsQueryOptions({
          cluster,
          solanaAddress,
          anchorProvider: undefined,
        }).queryKey,
      ),
    updateSolBalance: (args) => updateSolBalance(client, args),
    updateTokenBalance: (args) => updateTokenBalance(client, args),
    purge: () => client.clear(),
    readTokenPrices: (currency) =>
      outcome(
        client.fetchQuery({
          ...tokenPricesQueryOptions(currency),
          staleTime: 0,
        }),
      ),
    // One cached entry per currency, merged into one price table
    tokenPrices: () => {
      const byCurrency = entriesUnder<Prices>(client, TOKEN_PRICES_QUERY_KEY)
      if (!byCurrency.length) return undefined
      return byCurrency.reduce(
        (merged, [, prices]) => ({
          helium: { ...merged.helium, ...prices.helium },
          solana: { ...merged.solana, ...prices.solana },
          'helium-iot': { ...merged['helium-iot'], ...prices['helium-iot'] },
          'helium-mobile': {
            ...merged['helium-mobile'],
            ...prices['helium-mobile'],
          },
        }),
        {} as Prices,
      )
    },
    readBalanceHistory: (args) =>
      outcome(
        client.fetchQuery({
          ...balanceHistoryQueryOptions(args),
          staleTime: 0,
        }),
      ),
    balanceHistoryOf: (cluster, solanaAddress) => {
      const byCurrency = entriesUnder<AccountBalance[]>(client, [
        ...BALANCE_HISTORY_QUERY_KEY,
        cluster,
        solanaAddress,
      ])
      return byCurrency.length ? Object.fromEntries(byCurrency) : undefined
    },
  }
}
