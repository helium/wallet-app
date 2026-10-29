import { useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { Collectable } from '../types/solana'
import {
  getNFTs,
  getNFTsMetadata,
  groupNFTs,
  groupNFTsWithMetaData,
  onLogs,
  removeAccountChangeListener,
} from '../utils/solanaUtils'
import { WrappedConnection } from '../utils/WrappedConnection'
import { PersistedQueryRoot } from '../utils/queryClient'
import { useSolana } from '../solana/SolanaProvider'

export type WalletCollectables = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collectables: Record<string, any[]>
  collectablesWithMeta: Record<string, Collectable[]>
  loading: boolean
}

// A refresh this soon after a fetch is skipped: each one reads every NFT
const REFRESH_COOLDOWN_MS = 5_000

const collectablesQueryKey = (
  cluster: Cluster,
  solanaAddress: string,
): [PersistedQueryRoot, Cluster, string] => [
  'collectables',
  cluster,
  solanaAddress,
]

const fetchCollectables = async (
  solanaAddress: string,
  connection: WrappedConnection,
) => {
  const fetchedCollectables = await getNFTs(
    new PublicKey(solanaAddress),
    connection,
  )
  const collectablesWithMetadata = await getNFTsMetadata(fetchedCollectables)
  return {
    collectables: groupNFTs(fetchedCollectables),
    collectablesWithMeta: groupNFTsWithMetaData(collectablesWithMetadata),
  }
}

const useCollectables = (): WalletCollectables & {
  refresh: () => void
} => {
  const { cluster, anchorProvider } = useSolana()
  const queryClient = useQueryClient()
  const accountSubscriptionId = useRef<number | null>(null)
  const { currentAccount } = useAccountStorage()
  const { locked } = useAppStorage()
  const solanaAddress = currentAccount?.solanaAddress

  // Don't fetch collectables while locked - wait until unlock
  const enabled = !!solanaAddress && !!anchorProvider && !locked
  const { data, isFetching, refetch } = useQuery({
    queryKey: collectablesQueryKey(cluster, solanaAddress || ''),
    queryFn: () => {
      if (!solanaAddress || !anchorProvider) {
        throw new Error('Solana address or connection missing')
      }
      return fetchCollectables(
        solanaAddress,
        anchorProvider.connection as WrappedConnection,
      )
    },
    enabled,
  })

  const refresh = useCallback(() => {
    if (!enabled) return
    // Read here, so a fetch does not change the identity of refresh
    const lastFetch =
      queryClient.getQueryState(
        collectablesQueryKey(cluster, solanaAddress || ''),
      )?.dataUpdatedAt ?? 0
    if (Date.now() - lastFetch < REFRESH_COOLDOWN_MS) return
    // Join a fetch in flight instead of restarting it
    refetch({ cancelRefetch: false })
  }, [enabled, queryClient, cluster, solanaAddress, refetch])

  useEffect(() => {
    if (!solanaAddress || !anchorProvider || locked) return

    const subId = onLogs(anchorProvider, solanaAddress, () => {
      refresh()
    })

    if (accountSubscriptionId.current !== null) {
      removeAccountChangeListener(anchorProvider, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId

    return () => {
      if (accountSubscriptionId.current !== null) {
        removeAccountChangeListener(
          anchorProvider,
          accountSubscriptionId.current,
        )
        accountSubscriptionId.current = null
      }
    }
  }, [anchorProvider, solanaAddress, refresh, locked])

  return {
    collectables: data?.collectables || {},
    collectablesWithMeta: data?.collectablesWithMeta || {},
    loading: isFetching,
    refresh,
  }
}
export default useCollectables
