import { useCallback, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import * as client from '@helium/distributor-oracle'
import { PublicKey, Transaction } from '@solana/web3.js'
import { useAsyncCallback } from 'react-async-hook'
import BN from 'bn.js'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import {
  fetchHotspots,
  fetchMoreHotspots,
  hotspotsSlice,
} from '../store/slices/hotspotsSlice'
import { useAppDispatch } from '../store/store'
import { CompressedNFT, HotspotWithPendingRewards } from '../types/solana'
import { MOBILE_LAZY_KEY, IOT_LAZY_KEY, Mints } from '../utils/constants'
import { useSolana } from '../solana/SolanaProvider'

const useHotspots = (): {
  pendingIotRewards: BN | undefined
  pendingMobileRewards: BN | undefined
  hotspots: CompressedNFT[]
  hotspotsWithMeta: HotspotWithPendingRewards[]
  loading: boolean
  refresh: (limit?: number) => void
  createClaimAllMobileTxs: {
    loading: boolean
    error: Error | undefined
    execute: () => Promise<Transaction[] | undefined>
  }
  createClaimAllIotTxs: {
    loading: boolean
    error: Error | undefined
    execute: () => Promise<Transaction[] | undefined>
  }
  fetchMore: (limit?: number) => void
  fetchingMore: boolean
  onEndReached: boolean
} => {
  const { l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, lazyProgram, cluster } = useSolana()
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

  const hotspotsForClusterAcct = useMemo(() => {
    if (!currentAccount?.solanaAddress) return []

    return hotspots[currentAccount?.solanaAddress]?.hotspots || []
  }, [currentAccount?.solanaAddress, hotspots])

  const {
    execute: createClaimAllMobileTxs,
    loading: loadingClaimAllMobileTxs,
    error: errorClaimAllMobileTxs,
  } = useAsyncCallback(async () => {
    if (!anchorProvider || !currentAccount?.solanaAddress || !lazyProgram) {
      return
    }
    const { connection } = anchorProvider
    const wallet = new PublicKey(currentAccount?.solanaAddress)

    const txns = await Promise.all(
      hotspotsForClusterAcct.map(async (nft: CompressedNFT) => {
        const rewards = await client.getCurrentRewards(
          lazyProgram,
          MOBILE_LAZY_KEY,
          new PublicKey(nft.id),
        )

        return client.formTransaction({
          program: lazyProgram,
          provider: anchorProvider,
          rewards,
          hotspot: new PublicKey(nft.id),
          lazyDistributor: MOBILE_LAZY_KEY,
          assetEndpoint: connection.rpcEndpoint,
          wallet,
        })
      }),
    )

    return txns
  })

  const {
    execute: createClaimAllIotTxs,
    loading: loadingClaimAllIotTxs,
    error: errorClaimAllIotTxs,
  } = useAsyncCallback(async () => {
    if (!anchorProvider || !currentAccount?.solanaAddress || !lazyProgram) {
      return
    }
    const wallet = new PublicKey(currentAccount?.solanaAddress)
    const { connection } = anchorProvider

    const txns = await Promise.all(
      hotspots[currentAccount.solanaAddress].hotspots.map(
        async (nft: CompressedNFT) => {
          const rewards = await client.getCurrentRewards(
            lazyProgram,
            IOT_LAZY_KEY,
            new PublicKey(nft.id),
          )

          return client.formTransaction({
            program: lazyProgram,
            provider: anchorProvider,
            rewards,
            hotspot: new PublicKey(nft.id),
            lazyDistributor: IOT_LAZY_KEY,
            assetEndpoint: connection.rpcEndpoint,
            wallet,
          })
        },
      ),
    )

    return txns
  })

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
        l1Network !== 'solana' ||
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
    [
      currentAccount,
      l1Network,
      anchorProvider,
      hotspots,
      cluster,
      dispatch,
      page,
    ],
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
      createClaimAllMobileTxs: {
        execute: createClaimAllMobileTxs,
        loading: loadingClaimAllMobileTxs,
        error: errorClaimAllMobileTxs,
      },
      createClaimAllIotTxs: {
        execute: createClaimAllIotTxs,
        loading: loadingClaimAllIotTxs,
        error: errorClaimAllIotTxs,
      },
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
    createClaimAllMobileTxs: {
      execute: createClaimAllMobileTxs,
      loading: loadingClaimAllMobileTxs,
      error: errorClaimAllMobileTxs,
    },
    createClaimAllIotTxs: {
      execute: createClaimAllIotTxs,
      loading: loadingClaimAllIotTxs,
      error: errorClaimAllIotTxs,
    },
    fetchMore,
    fetchingMore,
    onEndReached,
  }
}
export default useHotspots
