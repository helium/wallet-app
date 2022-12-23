/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { init } from '@helium/lazy-distributor-sdk'
import * as client from '@helium/distributor-oracle'
import { PublicKey } from '@solana/web3.js'
import { useAsyncCallback } from 'react-async-hook'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { fetchCollectables } from '../store/slices/collectablesSlice'
import { useAppDispatch } from '../store/store'
import { onLogs, removeAccountChangeListener } from '../utils/solanaUtils'
import { CompressedNFT } from '../types/solana'
import { LAZY_KEY } from '../utils/hotspotNftsUtils'
import useSubmitTxn from '../graphql/useSubmitTxn'

const useHotspots = (): {
  hotspots: CompressedNFT[]
  hotspotsWithMeta: CompressedNFT[]
  loading: boolean
  refresh: () => void
  claimAllRewards: {
    loading: boolean
    error: Error | undefined
    execute: () => Promise<void>
  }
} => {
  const { solanaNetwork: cluster, l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number>()
  const { currentAccount, anchorProvider } = useAccountStorage()
  const collectables = useSelector((state: RootState) => state.collectables)
  const { submitAllAnchorTxns } = useSubmitTxn()

  const hotspots = useMemo(() => {
    if (!currentAccount?.solanaAddress) return []

    return (
      collectables[currentAccount?.solanaAddress].collectables.HOTSPOT || []
    )
  }, [collectables, currentAccount])

  const claimAllRewards = async () => {
    if (!anchorProvider || !currentAccount?.solanaAddress) {
      return
    }
    const program = await init(anchorProvider)
    const wallet = new PublicKey(currentAccount?.solanaAddress)

    const txns = await Promise.all(
      hotspots.map(async (nft) => {
        const rewards = await client.getCurrentRewards(
          program,
          LAZY_KEY,
          new PublicKey(nft.id),
        )
        return client.formTransaction({
          program,
          provider: anchorProvider,
          rewards,
          hotspot: new PublicKey(nft.id),
          lazyDistributor: LAZY_KEY,
          wallet,
        })
      }),
    )

    await submitAllAnchorTxns(txns)
  }

  const { execute, loading, error } = useAsyncCallback(claimAllRewards)

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
      claimAllRewards: {
        execute,
        error,
        loading,
      },
    }
  }

  return {
    hotspots,
    hotspotsWithMeta:
      collectables[currentAccount?.solanaAddress].collectablesWithMeta
        .HOTSPOT || [],
    loading: collectables[currentAccount?.solanaAddress].loading,
    refresh,
    claimAllRewards: {
      execute,
      error,
      loading,
    },
  }
}
export default useHotspots
