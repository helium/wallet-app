import BN from 'bn.js'
import { useCallback, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { RootState } from '../store/rootReducer'
import {
  fetchAllHotspots,
  fetchHotspots,
  hotspotsSlice,
} from '../store/slices/hotspotsSlice'
import { useAppDispatch } from '../store/store'
import { CompressedNFT, HotspotWithPendingRewards } from '../types/solana'
import { Mints } from '../utils/constants'

const useHotspots = (): {
  totalHotspots: number | undefined
  pendingIotRewards: BN | undefined
  pendingMobileRewards: BN | undefined
  hotspots: CompressedNFT[]
  hotspotsWithMeta: HotspotWithPendingRewards[]
  loading: boolean
  refresh: (limit?: number) => void
  fetchMore: (limit?: number) => void
  fetchAll: () => void
  fetchingMore: boolean
  onEndReached: boolean
} => {
  const dispatch = useAppDispatch()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, cluster } = useSolana()
  const hotspotsState = useSelector(
    (state: RootState) => state.hotspots[cluster] || {},
  )

  const hotspots = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspotsState[currentAccount?.solanaAddress]
    )
      return []

    return Object.values(
      hotspotsState[currentAccount?.solanaAddress].hotspotsById || {},
    )
  }, [currentAccount?.solanaAddress, hotspotsState])

  const hotspotsWithMeta = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspotsState[currentAccount?.solanaAddress]
    )
      return []

    return Object.values(
      hotspotsState[currentAccount?.solanaAddress].hotspotsById || {},
    ).map((hotspot) => ({
      ...hotspot,
      pendingRewards: {
        ...(hotspotsState[currentAccount?.solanaAddress as string]
          .hotspotsRewardsById[hotspot.id] || {}),
      },
      rewardRecipients: {
        ...((hotspotsState[currentAccount?.solanaAddress as string]
          .hotspotsRecipientsById || {})[hotspot.id] || {}),
      },
      content: {
        ...hotspot.content,
        metadata: {
          ...hotspot.content.metadata,
          ...(hotspotsState[currentAccount?.solanaAddress as string]
            .hotspotsMetadataById[hotspot.id] || {}),
        },
      },
    }))
  }, [currentAccount?.solanaAddress, hotspotsState])

  const page = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspotsState[currentAccount?.solanaAddress]
    )
      return 0
    return hotspotsState[currentAccount?.solanaAddress].page
  }, [currentAccount?.solanaAddress, hotspotsState])

  const totalHotspots = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspotsState[currentAccount?.solanaAddress]
    )
      return undefined
    return hotspotsState[currentAccount?.solanaAddress].totalHotspots
  }, [currentAccount?.solanaAddress, hotspotsState])

  const onEndReached = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspotsState[currentAccount?.solanaAddress]
    )
      return true
    return hotspotsState[currentAccount?.solanaAddress].onEndReached
  }, [currentAccount?.solanaAddress, hotspotsState])

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
      !hotspotsState[currentAccount?.solanaAddress]
    )
      return false

    return hotspotsState[currentAccount?.solanaAddress].fetchingMore
  }, [currentAccount?.solanaAddress, hotspotsState])

  const fetchMore = useCallback(
    (limit?) => {
      if (
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        hotspotsState[currentAccount?.solanaAddress].loading
      ) {
        return
      }

      dispatch(
        fetchHotspots({
          anchorProvider,
          cluster,
          account: currentAccount,
          page,
          limit,
        }),
      )
    },
    [currentAccount, anchorProvider, hotspotsState, cluster, dispatch, page],
  )

  const fetchAll = useCallback(() => {
    if (
      !currentAccount?.solanaAddress ||
      !anchorProvider ||
      hotspotsState[currentAccount?.solanaAddress].loading
    ) {
      return
    }

    dispatch(
      fetchAllHotspots({
        anchorProvider,
        cluster,
        account: currentAccount,
      }),
    )
  }, [currentAccount, anchorProvider, hotspotsState, cluster, dispatch])

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
    !hotspotsState[currentAccount?.solanaAddress]
  ) {
    return {
      totalHotspots,
      pendingIotRewards,
      pendingMobileRewards,
      loading: false,
      hotspots: [],
      hotspotsWithMeta: [],
      refresh,
      fetchAll,
      fetchMore,
      fetchingMore,
      onEndReached,
    }
  }

  return {
    totalHotspots,
    pendingIotRewards,
    pendingMobileRewards,
    hotspots,
    hotspotsWithMeta,
    loading: hotspotsState[currentAccount?.solanaAddress].loading,
    refresh,
    fetchMore,
    fetchAll,
    fetchingMore,
    onEndReached,
  }
}
export default useHotspots
