/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { JsonMetadata, Metadata } from '@metaplex-foundation/js'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { fetchCollectables } from '../store/slices/collectablesSlice'
import { useAppDispatch } from '../store/store'
import { onLogs, removeAccountChangeListener } from '../utils/solanaUtils'
import { Collectable } from '../types/solana'

const useHotspots = (): {
  hotspots: Metadata<JsonMetadata<string>>[]
  hotspotsWithMeta: Collectable[]
  loading: boolean
  refresh: () => void
} => {
  const { solanaNetwork: cluster, l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number>()
  const { currentAccount } = useAccountStorage()
  const collectables = useSelector((state: RootState) => state.collectables)

  const refresh = useCallback(() => {
    if (
      !currentAccount?.solanaAddress ||
      l1Network !== 'solana' ||
      collectables.loading
    ) {
      return
    }
    dispatch(fetchCollectables({ account: currentAccount, cluster }))
  }, [cluster, collectables.loading, currentAccount, dispatch, l1Network])

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return

    refresh()

    const subId = onLogs(cluster, currentAccount?.solanaAddress, () => {
      refresh()
    })

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(cluster, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
  }, [cluster, currentAccount, dispatch, l1Network, refresh])

  if (
    !currentAccount?.solanaAddress ||
    !collectables[currentAccount?.solanaAddress]
  ) {
    return {
      loading: false,
      hotspots: [],
      hotspotsWithMeta: [],
      refresh,
    }
  }

  return {
    hotspots:
      collectables[currentAccount?.solanaAddress].collectables.HOTSPOT || [],

    hotspotsWithMeta:
      collectables[currentAccount?.solanaAddress].collectablesWithMeta
        .HOTSPOT || [],
    loading: collectables[currentAccount?.solanaAddress].loading,
    refresh,
  }
}
export default useHotspots
