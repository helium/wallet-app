import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { usePublicKey } from '@hooks/usePublicKey'
import { useBalance } from '@utils/Balance'
import { useEffect, useMemo } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { classifyHoldings } from '../logic/assets'

export type MigratableHotspot = {
  entityKey: string
  name: string
  type: string
  deviceType: string
}

// Stable fallback so consumers' memos aren't invalidated by a fresh []
// identity on every render while the hotspots are still loading.
const NO_HOTSPOTS: MigratableHotspot[] = []

export const useMigrationAssets = (sourceWallet: string | undefined) => {
  const client = useBlockchainApi()
  const { tokenAccounts } = useBalance()
  const { visibleTokens } = useVisibleTokens()
  const { amount: lamports } = useSolOwnedAmount(usePublicKey(sourceWallet))

  const { execute, loading, result, error } = useAsyncCallback(async () => {
    if (!sourceWallet) return [] as MigratableHotspot[]
    const { hotspots } = await client.migration.getHotspots({
      walletAddress: sourceWallet,
    })
    return hotspots as MigratableHotspot[]
  })

  useEffect(() => {
    if (sourceWallet) execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceWallet])

  // The migratable set is the wallet's own view of what it holds — no token
  // list from the server, so one fewer call that can fail.
  const { migratableTokens, leftBehindMints } = useMemo(
    () =>
      classifyHoldings({
        holdings: tokenAccounts ?? [],
        visibleTokens,
        solBalance: Number(lamports ?? 0) / LAMPORTS_PER_SOL,
      }),
    [tokenAccounts, visibleTokens, lamports],
  )

  return {
    // The kick-off effect fires after the first render with a wallet, so count
    // that not-yet-started gap as loading — an empty pre-fetch snapshot must
    // not read as a wallet with nothing to migrate.
    loading: loading || (!!sourceWallet && !result && !error),
    error,
    reload: execute,
    hotspots: result ?? NO_HOTSPOTS,
    tokens: migratableTokens,
    leftBehindMints,
  }
}
