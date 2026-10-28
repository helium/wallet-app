import { AnchorProvider } from '@anchor-lang/core'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Cluster, PublicKey } from '@solana/web3.js'
import { QueryClient, queryOptions } from '@tanstack/react-query'
import { CSAccount } from '../storage/cloudStorage'
import { decodeTokenAccount } from '../store/logic/tokenAccounts'
import { AccountBalance, Prices, TokenAccount } from '../types/balance'
import { PersistedQueryRoot } from './queryClient'
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

  const solAcct = await connection.getAccountInfo(pubKey)

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

    try {
      const mintAccountInfos = await connection.getMultipleAccountsInfo(batch)

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
      console.warn(`Failed to fetch mint batch ${i}-${i + BATCH_SIZE}:`, error)
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
  const atas: TokenAccount[] = tokenAccountsData.map((tokenAccountData) => ({
    tokenAccount: tokenAccountData.pubkey.toBase58(),
    mint: tokenAccountData.mint.toBase58(),
    balance: Number(tokenAccountData.amount || 0),
    decimals: mintInfoMap.get(tokenAccountData.mint.toBase58()) || 0,
    frozen: tokenAccountData.frozen,
  }))

  const solBalance = solAcct?.lamports || 0
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

// Global sync guard to prevent overlapping syncs from ANY source
const balancesSyncGuard = new SyncGuard()

// Rejects when a sync of any wallet is in flight, or this wallet synced on
// this cluster in the last 5 seconds; the stored balances stay as they are
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
  const syncKey = `${cluster}-${acct.solanaAddress}`

  // Check if sync can proceed
  if (!balancesSyncGuard.canSync(syncKey)) {
    throw new Error('Sync already in progress or cooldown active')
  }

  balancesSyncGuard.startSync(syncKey)

  try {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    return await queryClient.fetchQuery({
      ...tokenAccountsQueryOptions({
        cluster,
        solanaAddress: acct.solanaAddress,
        anchorProvider,
      }),
      staleTime: 0,
    })
  } finally {
    balancesSyncGuard.endSync()
  }
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
