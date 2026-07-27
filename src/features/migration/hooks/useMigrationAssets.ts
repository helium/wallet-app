import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useBalance } from '@utils/Balance'
import { useEffect } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { classifyHoldings } from '../logic/assets'
import { SelectableToken } from '../logic/types'

export type MigratableHotspot = {
  entityKey: string
  name: string
  type: string
  deviceType: string
}

// Stable fallbacks so consumers' memos aren't invalidated by fresh [] identities
// on every render while the assets are still loading.
const NO_HOTSPOTS: MigratableHotspot[] = []
const NO_TOKENS: SelectableToken[] = []
const NO_MINTS: string[] = []

export const useMigrationAssets = (sourceWallet: string | undefined) => {
  const client = useBlockchainApi()
  const { tokenAccounts } = useBalance()

  const { execute, loading, result, error } = useAsyncCallback(async () => {
    if (!sourceWallet) {
      return {
        hotspots: [] as MigratableHotspot[],
        tokens: [] as SelectableToken[],
        leftBehindMints: [] as string[],
      }
    }
    const [hotspotsResult, balances] = await Promise.all([
      client.migration.getHotspots({ walletAddress: sourceWallet }),
      client.tokens.getBalances({ walletAddress: sourceWallet }),
    ])

    const { migratableTokens, leftBehindMints } = classifyHoldings({
      migratable: balances.tokens,
      solBalance: balances.solBalance,
      holdings: (tokenAccounts ?? []).map((a) => ({
        mint: a.mint,
        balance: a.balance,
        decimals: a.decimals,
      })),
    })

    return {
      hotspots: hotspotsResult.hotspots as MigratableHotspot[],
      tokens: migratableTokens,
      leftBehindMints,
    }
  })

  useEffect(() => {
    if (sourceWallet) execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceWallet])

  return {
    // The kick-off effect fires after the first render with a wallet, so count
    // that not-yet-started gap as loading — an empty pre-fetch snapshot must
    // not read as a wallet with nothing to migrate.
    loading: loading || (!!sourceWallet && !result && !error),
    error,
    reload: execute,
    hotspots: result?.hotspots ?? NO_HOTSPOTS,
    tokens: result?.tokens ?? NO_TOKENS,
    leftBehindMints: result?.leftBehindMints ?? NO_MINTS,
  }
}
