import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useBalance } from '@utils/Balance'
import { useCallback, useEffect } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { classifyHoldings } from '../logic/assets'
import { SelectableToken } from '../logic/types'

export type MigratableHotspot = {
  entityKey: string
  name: string
  type: string
  deviceType: string
}

export const useMigrationAssets = (sourceWallet: string | undefined) => {
  const client = useBlockchainApi()
  const { tokenAccounts } = useBalance()

  const { execute, loading, error, result } = useAsyncCallback(async () => {
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

  const reload = useCallback(() => {
    execute()
  }, [execute])

  useEffect(() => {
    if (sourceWallet) execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceWallet])

  return {
    loading,
    error,
    hotspots: result?.hotspots ?? [],
    tokens: result?.tokens ?? [],
    leftBehindMints: result?.leftBehindMints ?? [],
    reload,
  }
}
