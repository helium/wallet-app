import BN from 'bn.js'
import { useCallback, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { RootState } from '../store/rootReducer'
import {
  fetchHotspots,
  fetchMoreHotspots,
  hotspotsSlice,
} from '../store/slices/hotspotsSlice'
import { useAppDispatch } from '../store/store'
import { CompressedNFT, HotspotWithPendingRewards } from '../types/solana'
import { Mints } from '../utils/constants'

const useHotspots = (): {
  pendingIotRewards: BN | undefined
  pendingMobileRewards: BN | undefined
  hotspots: CompressedNFT[]
  hotspotsWithMeta: HotspotWithPendingRewards[]
  loading: boolean
  refresh: (limit?: number) => void
  fetchMore: (limit?: number) => void
  fetchingMore: boolean
  onEndReached: boolean
} => {
  const dispatch = useAppDispatch()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, cluster } = useSolana()
  const hotspots = useSelector(
    (state: RootState) => state.hotspots[cluster] || {},
  )

  const page = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspots[currentAccount?.solanaAddress]
    )
      return 0
    return hotspots[currentAccount?.solanaAddress].page
  }, [currentAccount?.solanaAddress, hotspots])

  const onEndReached = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspots[currentAccount?.solanaAddress]
    )
      return true
    return hotspots[currentAccount?.solanaAddress].onEndReached
  }, [currentAccount?.solanaAddress, hotspots])

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return
    // Reset loading on mount
    dispatch(
      hotspotsSlice.actions.resetLoading({ acct: currentAccount, cluster }),
    )
  }, [cluster, currentAccount, dispatch])

  const refresh = useCallback(
    (limit?) => {
      if (!anchorProvider || !currentAccount?.solanaAddress) {
        return
      }

      dispatch(
        fetchHotspots({
          anchorProvider,
          account: currentAccount,
          cluster,
          limit,
        }),
      )
    },
    [anchorProvider, cluster, currentAccount, dispatch],
  )

  const fetchingMore = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspots[currentAccount?.solanaAddress]
    )
      return false

    return hotspots[currentAccount?.solanaAddress].fetchingMore
  }, [currentAccount?.solanaAddress, hotspots])

  const fetchMore = useCallback(
    (limit?) => {
      if (
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        hotspots[currentAccount?.solanaAddress].loading
      ) {
        return
      }

      dispatch(
        fetchMoreHotspots({
          provider: anchorProvider,
          cluster,
          account: currentAccount,
          page,
          limit,
        }),
      )
    },
    [currentAccount, anchorProvider, hotspots, cluster, dispatch, page],
  )

  const hotspotsWithMeta = currentAccount?.solanaAddress
    ? hotspots[currentAccount?.solanaAddress]?.hotspotsWithMeta
    : undefined

  const pendingIotRewards = useMemo(
    () =>
      hotspotsWithMeta?.reduce((acc, hotspot) => {
        if (hotspot.pendingRewards) {
          return acc.add(new BN(hotspot.pendingRewards[Mints.IOT] || '0'))
        }

        return acc
      }, new BN(0)),
    [hotspotsWithMeta],
  )
  const pendingMobileRewards = useMemo(
    () =>
      hotspotsWithMeta?.reduce((acc, hotspot) => {
        if (hotspot.pendingRewards) {
          return acc.add(new BN(hotspot.pendingRewards[Mints.MOBILE] || '0'))
        }

        return acc
      }, new BN(0)),
    [hotspotsWithMeta],
  )

  if (
    !currentAccount?.solanaAddress ||
    !hotspots[currentAccount?.solanaAddress]
  ) {
    return {
      pendingIotRewards,
      pendingMobileRewards,
      loading: false,
      hotspots: [],
      hotspotsWithMeta: [],
      refresh,
      fetchMore,
      fetchingMore,
      onEndReached,
    }
  }

  return {
    pendingIotRewards,
    pendingMobileRewards,
    hotspots: hotspots[currentAccount?.solanaAddress].hotspots,
    hotspotsWithMeta: hotspots[currentAccount?.solanaAddress]?.hotspotsWithMeta,
    loading: hotspots[currentAccount?.solanaAddress].loading,
    refresh,
    fetchMore,
    fetchingMore,
    onEndReached,
  }
}
export default useHotspots
