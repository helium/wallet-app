import { useCallback, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
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
    // Join a fetch in flight instead of restarting it
    refetch({ cancelRefetch: false })
  }, [enabled, refetch])

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
