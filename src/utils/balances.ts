import { AnchorProvider } from '@anchor-lang/core'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Cluster, PublicKey } from '@solana/web3.js'
import { QueryClient, queryOptions } from '@tanstack/react-query'
import { CSAccount } from '../storage/cloudStorage'
import { decodeTokenAccount } from '../store/logic/tokenAccounts'
import { AccountBalance, Prices, TokenAccount } from '../types/balance'
import { PersistedQueryRoot } from './queryClient'
import { withTimeout } from './oraclePrice'
import { SyncGuard } from './syncGuard'
import { getBalanceHistory, getTokenPrices } from './walletApiV2'

export type Tokens = {
  atas: TokenAccount[]
  sol: { tokenAccount: string; balance: number }
}

// Key prefixes under the persisted 'balances' root
export const TOKEN_ACCOUNTS_QUERY_KEY = ['balances', 'tokens'] as [
  PersistedQueryRoot,
  'tokens',
]
export const TOKEN_PRICES_QUERY_KEY = ['balances', 'prices'] as [
  PersistedQueryRoot,
  'prices',
]
export const BALANCE_HISTORY_QUERY_KEY = ['balances', 'history'] as [
  PersistedQueryRoot,
  'history',
]

const fetchTokens = async (
  solanaAddress: string,
  anchorProvider: AnchorProvider,
): Promise<Tokens> => {
  const pubKey = new PublicKey(solanaAddress)
  const { connection } = anchorProvider

  const tokenAccounts = await connection.getTokenAccountsByOwner(pubKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  const solBalance = await connection.getBalance(pubKey)

  // Decode all token account data first
  const tokenAccountsData = tokenAccounts.value.map((tokenAccount) => ({
    pubkey: tokenAccount.pubkey,
    ...decodeTokenAccount(tokenAccount.account.data),
  }))

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

    // A failed or missing mint read fails the sync, so the stored balances
    // keep their decimals. A commitment other than the account cache's skips
    // the cache, so a failed read rejects and a cached null cannot fail the
    // sync; mint decimals never change, so finalized data is enough
    const mintAccountInfos = await connection.getMultipleAccountsInfo(
      batch,
      'finalized',
    )

    const batchMintInfos = batchMints.map((mintStr, index) => {
      const accountInfo = mintAccountInfos[index]
      if (!accountInfo || !accountInfo.data) {
        throw new Error(`Mint account ${mintStr} not found`)
      }
      // Parse mint account data to get decimals (decimals is at offset 44)
      const decimals = accountInfo.data[44]
      return { mint: mintStr, decimals }
    })

    mintInfos.push(...batchMintInfos)
  }

  // Create mint info lookup map
  const mintInfoMap = new Map(
    mintInfos.map((info) => [info.mint, info.decimals]),
  )

  // Build token accounts with batched mint info
  const atas: TokenAccount[] = tokenAccountsData.map((tokenAccountData) => ({
    tokenAccount: tokenAccountData.pubkey.toBase58(),
    mint: tokenAccountData.mint.toBase58(),
    balance: Number(tokenAccountData.amount || 0),
    decimals: mintInfoMap.get(tokenAccountData.mint.toBase58()) || 0,
    frozen: tokenAccountData.frozen,
  }))

  const sol = {
    tokenAccount: solanaAddress,
    balance: solBalance,
  }

  return {
    atas,
    sol,
  }
}

// Read with `enabled: false`: only syncTokenAccounts fetches, behind its guard
export const tokenAccountsQueryOptions = ({
  cluster,
  solanaAddress,
  anchorProvider,
}: {
  cluster: Cluster
  solanaAddress: string
  anchorProvider: AnchorProvider | undefined
}) =>
  queryOptions({
    queryKey: [...TOKEN_ACCOUNTS_QUERY_KEY, cluster, solanaAddress] as [
      PersistedQueryRoot,
      'tokens',
      Cluster,
      string,
    ],
    queryFn: () => {
      if (!anchorProvider) throw new Error('Solana connection missing')
      return fetchTokens(solanaAddress, anchorProvider)
    },
  })

// A sync still waiting on the RPC after this long fails, so the next one runs
export const TOKEN_SYNC_TIMEOUT = 1000 * 30 // 30 seconds

// Global sync guard to prevent overlapping syncs from ANY source
const balancesSyncGuard = new SyncGuard()

// The sync key in flight, the syncs of other wallets waiting for it to end
// (one per key), and the last sync in line, which the next waiter follows
let syncingKey: string | undefined
const waitingSyncs = new Map<string, Promise<Tokens>>()
let lastSync: Promise<unknown> = Promise.resolve()

// A sync of another wallet waits for the one in flight to end; a repeat of a
// waiting wallet shares its sync. Rejects when this wallet's sync is in
// flight, or this wallet's sync on this cluster was the last one started, less
// than 5 seconds ago; the stored balances stay as they are
export const syncTokenAccounts = async (
  queryClient: QueryClient,
  {
    cluster,
    acct,
    anchorProvider,
  }: {
    cluster: Cluster
    acct: CSAccount
    anchorProvider: AnchorProvider
  },
): Promise<Tokens> => {
  if (!acct?.solanaAddress) throw new Error('No solana account found')

  const { solanaAddress } = acct
  const syncKey = `${cluster}-${solanaAddress}`

  const waiting = waitingSyncs.get(syncKey)
  if (waiting) return waiting

  if (syncingKey === syncKey) {
    throw new Error('Sync already in progress or cooldown active')
  }

  const sync = async () => {
    waitingSyncs.delete(syncKey)

    // Check if sync can proceed
    if (!balancesSyncGuard.canSync(syncKey)) {
      throw new Error('Sync already in progress or cooldown active')
    }

    balancesSyncGuard.startSync(syncKey)
    syncingKey = syncKey

    const options = tokenAccountsQueryOptions({
      cluster,
      solanaAddress,
      anchorProvider,
    })
    try {
      return await withTimeout(
        queryClient.fetchQuery({ ...options, staleTime: 0 }),
        TOKEN_SYNC_TIMEOUT,
        'Token account sync timed out',
      )
    } catch (e) {
      // Drop a hung fetch, or the next sync of this wallet joins it
      await queryClient.cancelQueries({
        queryKey: options.queryKey,
        exact: true,
      })
      throw e
    } finally {
      balancesSyncGuard.endSync()
      syncingKey = undefined
    }
  }

  // A waiting sync keeps the line busy between one sync's end and its start
  if (syncingKey || waitingSyncs.size) {
    const queued = lastSync.then(sync, sync)
    waitingSyncs.set(syncKey, queued)
    lastSync = queued
    return queued
  }

  const running = sync()
  lastSync = running
  return running
}

// Replaces the SOL balance of a wallet that has synced
export const updateSolBalance = (
  queryClient: QueryClient,
  {
    cluster,
    solanaAddress,
    balance,
    tokenAccount,
  }: {
    cluster: Cluster
    solanaAddress: string
    balance: number
    tokenAccount: string
  },
) => {
  queryClient.setQueryData(
    tokenAccountsQueryOptions({
      cluster,
      solanaAddress,
      anchorProvider: undefined,
    }).queryKey,
    (prev) => prev && { ...prev, sol: { tokenAccount, balance } },
  )
}

// Replaces the balance of the token account matching both account and mint
export const updateTokenBalance = (
  queryClient: QueryClient,
  {
    cluster,
    solanaAddress,
    balance,
    mint,
    tokenAccount,
  }: {
    cluster: Cluster
    solanaAddress: string
    balance: number
    mint: string
    tokenAccount: string
  },
) => {
  queryClient.setQueryData(
    tokenAccountsQueryOptions({
      cluster,
      solanaAddress,
      anchorProvider: undefined,
    }).queryKey,
    (prev) =>
      prev && {
        ...prev,
        atas: prev.atas.map((ata) =>
          ata.tokenAccount === tokenAccount && ata.mint === mint
            ? { ...ata, balance }
            : ata,
        ),
      },
  )
}

// The price of each token in one currency
export const tokenPricesQueryOptions = (currency: string) =>
  queryOptions({
    queryKey: [...TOKEN_PRICES_QUERY_KEY, currency] as [
      PersistedQueryRoot,
      'prices',
      string,
    ],
    queryFn: async (): Promise<Prices> => {
      const prices = await getTokenPrices(currency)
      return {
        helium: { [currency]: prices.helium[currency] },
        solana: { [currency]: prices.solana[currency] },
        'helium-iot': { [currency]: prices['helium-iot'][currency] },
        'helium-mobile': { [currency]: prices['helium-mobile'][currency] },
      }
    },
  })

export const balanceHistoryQueryOptions = ({
  cluster,
  solanaAddress,
  currency,
}: {
  cluster: Cluster
  solanaAddress: string
  currency: string
}) =>
  queryOptions({
    queryKey: [
      ...BALANCE_HISTORY_QUERY_KEY,
      cluster,
      solanaAddress,
      currency,
    ] as [PersistedQueryRoot, 'history', Cluster, string, string],
    queryFn: (): Promise<AccountBalance[]> =>
      getBalanceHistory({ currency, solanaAddress, cluster }),
  })
