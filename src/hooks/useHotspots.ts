import { AnchorProvider } from '@anchor-lang/core'
import { Cluster, PublicKey } from '@solana/web3.js'
import {
  InfiniteData,
  QueryClient,
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import BN from 'bn.js'
import { useCallback, useMemo } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { CompressedNFT, HotspotWithPendingRewards } from '../types/solana'
import { Mints } from '../utils/constants'
import { PersistedQueryRoot } from '../utils/queryClient'
import * as solUtils from '../utils/solanaUtils'

const DEFAULT_PAGE_AMOUNT = 20

type HotspotsQueryArgs = {
  cluster: Cluster
  solanaAddress: string
  anchorProvider: AnchorProvider | undefined
}

type HotspotsPage = {
  items: CompressedNFT[]
  grandTotal: number | undefined
  metadata: Awaited<ReturnType<typeof solUtils.getCompressedNFTMetadata>>
  rewards: Awaited<ReturnType<typeof solUtils.getHotspotPendingRewards>>
  recipients: Awaited<ReturnType<typeof solUtils.getHotspotRecipients>>
}

type AllHotspots = {
  hotspots: CompressedNFT[]
  recipients: HotspotsPage['recipients']
}

const isLastPage = (page: HotspotsPage) =>
  page.items.length < DEFAULT_PAGE_AMOUNT

const requireAnchorProvider = (anchorProvider: AnchorProvider | undefined) => {
  if (!anchorProvider) throw new Error('Solana connection missing')
  return anchorProvider
}

export const hotspotsQueryOptions = ({
  cluster,
  solanaAddress,
  anchorProvider,
}: HotspotsQueryArgs) =>
  infiniteQueryOptions({
    queryKey: ['hotspots', cluster, solanaAddress] as [
      PersistedQueryRoot,
      Cluster,
      string,
    ],
    queryFn: async ({ pageParam }): Promise<HotspotsPage> => {
      const provider = requireAnchorProvider(anchorProvider)
      const fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
        new PublicKey(solanaAddress),
        provider,
        pageParam + 1,
        DEFAULT_PAGE_AMOUNT,
      )

      // Batch the metadata, rewards, and recipients calls in parallel
      const [metadata, rewards, recipients] = await Promise.all([
        solUtils.getCompressedNFTMetadata(fetchedHotspots.items),
        solUtils.getHotspotPendingRewards(provider, fetchedHotspots.items),
        solUtils.getHotspotRecipients(provider, fetchedHotspots.items),
      ])

      return {
        items: fetchedHotspots.items,
        grandTotal: fetchedHotspots.grandTotal,
        metadata,
        rewards,
        recipients,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      isLastPage(lastPage) ? undefined : allPages.length,
  })

// Every hotspot of the wallet without metadata or rewards, for the map
export const allHotspotsQueryOptions = ({
  cluster,
  solanaAddress,
  anchorProvider,
}: HotspotsQueryArgs) =>
  queryOptions({
    queryKey: ['hotspots', cluster, solanaAddress, 'all'] as [
      PersistedQueryRoot,
      Cluster,
      string,
      'all',
    ],
    queryFn: async (): Promise<AllHotspots> => {
      const provider = requireAnchorProvider(anchorProvider)
      const pubKey = new PublicKey(solanaAddress)

      let pageNumber = 1
      let fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
        pubKey,
        provider,
        pageNumber,
        1000,
      )

      const hotspots: CompressedNFT[] = fetchedHotspots.items ?? []

      while (
        hotspots.length < (fetchedHotspots.grandTotal ?? fetchedHotspots.total)
      ) {
        // eslint-disable-next-line no-plusplus
        pageNumber++
        fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
          pubKey,
          provider,
          pageNumber,
          1000,
        )

        hotspots.push(...(fetchedHotspots.items ?? []))
      }

      const recipients = await solUtils.getHotspotRecipients(provider, hotspots)

      return { hotspots, recipients }
    },
  })

// Fetch the first page again and drop the later pages and the full list, so
// the list starts over from the top
export const refreshHotspots = (
  queryClient: QueryClient,
  args: HotspotsQueryArgs & { anchorProvider: AnchorProvider },
) => {
  const options = hotspotsQueryOptions(args)
  queryClient.setQueryData(
    options.queryKey,
    (data) =>
      data && {
        pages: data.pages.slice(0, 1),
        pageParams: data.pageParams.slice(0, 1),
      },
  )
  queryClient.resetQueries({
    queryKey: allHotspotsQueryOptions(args).queryKey,
    exact: true,
  })
  return queryClient.prefetchInfiniteQuery({ ...options, staleTime: 0 })
}

export const selectHotspots = (
  pagesData: InfiniteData<HotspotsPage> | undefined,
  allHotspots: AllHotspots | undefined,
) => {
  const pages = pagesData?.pages || []
  const hotspotsById = new Map<string, CompressedNFT>()
  pages
    .flatMap((page) => page.items)
    .concat(allHotspots?.hotspots || [])
    .forEach((hotspot) => hotspotsById.set(hotspot.id, hotspot))

  const metadataById = Object.fromEntries(
    pages.flatMap((page) => page.metadata).map((m) => [m.id, m.metadata]),
  )
  const rewardsById = Object.fromEntries(
    pages.flatMap((page) => page.rewards).map((r) => [r.id, r.pendingRewards]),
  )
  const recipientsById = Object.fromEntries(
    pages
      .flatMap((page) => page.recipients)
      .concat(allHotspots?.recipients || [])
      .map((r) => [r.id, r.recipients]),
  )

  const hotspots = [...hotspotsById.values()]
  const hotspotsWithMeta = hotspots.map((hotspot) => ({
    ...hotspot,
    pendingRewards: { ...(rewardsById[hotspot.id] || {}) },
    rewardRecipients: { ...(recipientsById[hotspot.id] || {}) },
    content: {
      ...hotspot.content,
      metadata: {
        ...hotspot.content.metadata,
        ...(metadataById[hotspot.id] || {}),
      },
    },
  }))

  const lastPage = pages[pages.length - 1]
  if (allHotspots) {
    return {
      hotspots,
      hotspotsWithMeta,
      totalHotspots: allHotspots.hotspots.length,
      onEndReached: true,
    }
  }
  return {
    hotspots,
    hotspotsWithMeta,
    totalHotspots: lastPage?.grandTotal,
    onEndReached: !lastPage || isLastPage(lastPage),
  }
}

const useHotspots = (): {
  totalHotspots: number | undefined
  pendingIotRewards: BN | undefined
  pendingMobileRewards: BN | undefined
  pendingHntRewards: BN | undefined
  hotspots: CompressedNFT[]
  hotspotsWithMeta: HotspotWithPendingRewards[]
  loading: boolean
  refresh: () => void
  fetchMore: () => void
  fetchAll: () => void
  fetchingMore: boolean
  onEndReached: boolean
} => {
  const queryClient = useQueryClient()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, cluster } = useSolana()
  const solanaAddress = currentAccount?.solanaAddress
  const args = { cluster, solanaAddress: solanaAddress || '', anchorProvider }

  // Screens fetch on demand through refresh, fetchMore and fetchAll
  const {
    data: pagesData,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({ ...hotspotsQueryOptions(args), enabled: false })
  const {
    data: allHotspots,
    isFetching: fetchingAll,
    refetch: refetchAll,
  } = useQuery({ ...allHotspotsQueryOptions(args), enabled: false })

  const loading = (isFetching && !isFetchingNextPage) || fetchingAll

  const { hotspots, hotspotsWithMeta, totalHotspots, onEndReached } = useMemo(
    () => selectHotspots(pagesData, allHotspots),
    [pagesData, allHotspots],
  )

  const refresh = useCallback(() => {
    if (!anchorProvider || !solanaAddress) {
      return
    }

    refreshHotspots(queryClient, { cluster, solanaAddress, anchorProvider })
  }, [anchorProvider, cluster, queryClient, solanaAddress])

  const fetchMore = useCallback(() => {
    if (!solanaAddress || !anchorProvider || loading) {
      return
    }

    fetchNextPage({ cancelRefetch: false })
  }, [solanaAddress, anchorProvider, loading, fetchNextPage])

  const fetchAll = useCallback(() => {
    if (!solanaAddress || !anchorProvider || loading) {
      return
    }

    refetchAll({ cancelRefetch: false })
  }, [solanaAddress, anchorProvider, loading, refetchAll])

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

  const pendingHntRewards = useMemo(
    () =>
      hotspotsWithMeta?.reduce((acc, hotspot) => {
        return acc.add(new BN(hotspot.pendingRewards[Mints.HNT] || '0'))
      }, new BN(0)),
    [hotspotsWithMeta],
  )

  return {
    totalHotspots,
    pendingIotRewards,
    pendingMobileRewards,
    pendingHntRewards,
    hotspots,
    hotspotsWithMeta,
    loading,
    refresh,
    fetchMore,
    fetchAll,
    fetchingMore: isFetchingNextPage,
    onEndReached,
  }
}
export default useHotspots
