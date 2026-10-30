import { AnchorProvider } from '@anchor-lang/core'
import {
  InfiniteQueryObserver,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React, { useEffect } from 'react'
import TestRenderer, { act, ReactTestRenderer } from 'react-test-renderer'
import { CompressedNFT } from '../../types/solana'
import * as solUtils from '../../utils/solanaUtils'
import { createQueryClient } from '../../utils/queryClient'
import useHotspots, {
  allHotspotsQueryOptions,
  hotspotsQueryOptions,
  refreshHotspots,
  selectHotspots,
} from '../useHotspots'

jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ cluster: 'mainnet-beta', anchorProvider: {} }),
}))
jest.mock('../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({
    currentAccount: {
      solanaAddress: 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
    },
  }),
}))
jest.mock('../../utils/solanaUtils', () => ({
  getCompressedCollectablesByCreator: jest.fn(),
  getCompressedNFTMetadata: jest.fn(),
  getHotspotPendingRewards: jest.fn(),
  getHotspotRecipients: jest.fn(),
}))

const mocked = solUtils as jest.Mocked<typeof solUtils>

const args = {
  cluster: 'mainnet-beta' as const,
  solanaAddress: 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
  anchorProvider: {} as AnchorProvider,
}

const makeHotspots = (count: number) =>
  Array.from(
    { length: count },
    (_, i) =>
      ({
        id: `hotspot-${i}`,
        content: { metadata: { name: `Hotspot ${i}` } },
      }) as unknown as CompressedNFT,
  )

// A wallet that owns `count` hotspots, served by page like the DAS API
const ownHotspots = (count: number) => {
  const owned = makeHotspots(count)
  mocked.getCompressedCollectablesByCreator.mockImplementation(
    async (_pubKey, _provider, page = 1, limit = 1000) =>
      ({
        items: owned.slice((page - 1) * limit, page * limit),
        grandTotal: count,
      }) as Awaited<
        ReturnType<typeof solUtils.getCompressedCollectablesByCreator>
      >,
  )
  mocked.getCompressedNFTMetadata.mockImplementation(async (items) =>
    items.map(({ id }) => ({ id, metadata: { hotspot_infos: { id } } })),
  )
  mocked.getHotspotPendingRewards.mockImplementation(async (_p, items) =>
    items.map(({ id }) => ({ id, pendingRewards: { hnt: `reward-${id}` } })),
  )
  mocked.getHotspotRecipients.mockImplementation(async (_p, items) =>
    items.map(({ id }) => ({ id, recipients: { hnt: undefined } })),
  )
}

const requestedPages = () =>
  mocked.getCompressedCollectablesByCreator.mock.calls.map(
    ([, , page, limit]) => [page, limit],
  )

let client: QueryClient
const pagesData = () => client.getQueryData(hotspotsQueryOptions(args).queryKey)
const allData = () =>
  client.getQueryData(allHotspotsQueryOptions(args).queryKey)

const fetchMore = () =>
  new InfiniteQueryObserver(client, {
    ...hotspotsQueryOptions(args),
    enabled: false,
  }).fetchNextPage()

beforeEach(() => {
  jest.clearAllMocks()
  client = createQueryClient()
})

afterEach(() => {
  client.clear()
})

describe('hotspots query', () => {
  // The persister reads the wallet address at index 2 of each key
  it('keys both queries by cluster and wallet address', () => {
    expect(hotspotsQueryOptions(args).queryKey).toEqual([
      'hotspots',
      args.cluster,
      args.solanaAddress,
    ])
    expect(allHotspotsQueryOptions(args).queryKey).toEqual([
      'hotspots',
      args.cluster,
      args.solanaAddress,
      'all',
    ])
  })

  it('loads 20 hotspots a page until a short page ends the list', async () => {
    ownHotspots(45)

    await refreshHotspots(client, args)
    await fetchMore()
    expect(selectHotspots(pagesData(), allData(), false, false)).toMatchObject({
      totalHotspots: 45,
      onEndReached: false,
    })

    await fetchMore()
    const { hotspots, onEndReached } = selectHotspots(
      pagesData(),
      allData(),
      false,
      false,
    )

    expect(requestedPages()).toEqual([
      [1, 20],
      [2, 20],
      [3, 20],
    ])
    expect(hotspots.map(({ id }) => id)).toEqual(
      makeHotspots(45).map(({ id }) => id),
    )
    expect(onEndReached).toBe(true)
  })

  it('adds the fetched metadata, pending rewards and recipients to each hotspot', async () => {
    ownHotspots(1)

    await refreshHotspots(client, args)

    expect(
      selectHotspots(pagesData(), allData(), false, false).hotspotsWithMeta,
    ).toEqual([
      {
        id: 'hotspot-0',
        content: {
          metadata: { name: 'Hotspot 0', hotspot_infos: { id: 'hotspot-0' } },
        },
        pendingRewards: { hnt: 'reward-hotspot-0' },
        rewardRecipients: { hnt: undefined },
      },
    ])
  })

  it('adds every hotspot from the full list and ends the list', async () => {
    ownHotspots(45)

    await refreshHotspots(client, args)
    await client.fetchQuery(allHotspotsQueryOptions(args))
    const { hotspots, hotspotsWithMeta, totalHotspots, onEndReached } =
      selectHotspots(pagesData(), allData(), false, false)

    expect(hotspots).toHaveLength(45)
    expect(totalHotspots).toBe(45)
    expect(onEndReached).toBe(true)
    // A first-page hotspot keeps its rewards; a full-list one has none
    expect(hotspotsWithMeta[0].pendingRewards).toEqual({
      hnt: 'reward-hotspot-0',
    })
    expect(hotspotsWithMeta[44].pendingRewards).toEqual({})
    expect(hotspotsWithMeta[44].rewardRecipients).toEqual({ hnt: undefined })
  })

  it('refresh fetches only the first page again and drops the full list', async () => {
    ownHotspots(45)
    await refreshHotspots(client, args)
    await fetchMore()
    await client.fetchQuery(allHotspotsQueryOptions(args))
    mocked.getCompressedCollectablesByCreator.mockClear()

    await refreshHotspots(client, args)
    const { hotspots, onEndReached } = selectHotspots(
      pagesData(),
      allData(),
      false,
      false,
    )

    expect(requestedPages()).toEqual([[1, 20]])
    expect(allData()).toBeUndefined()
    expect(hotspots).toHaveLength(20)
    expect(onEndReached).toBe(false)
  })

  it('refresh while a next page loads fetches the first page again and keeps only it', async () => {
    ownHotspots(45)
    const servePage = mocked.getCompressedCollectablesByCreator
      .getMockImplementation()
      ?.bind(null)
    let releaseNextPage: () => void = () => {}
    let nextPageStarted: () => void = () => {}
    const nextPageRequested = new Promise<void>((resolve) => {
      nextPageStarted = resolve
    })
    mocked.getCompressedCollectablesByCreator.mockImplementation(
      async (pubKey, provider, page, limit) => {
        if (!servePage) throw new Error('no page mock')
        if (page === 2 && limit === 20) {
          nextPageStarted()
          await new Promise<void>((resolve) => {
            releaseNextPage = resolve
          })
        }
        return servePage(pubKey, provider, page, limit)
      },
    )
    await refreshHotspots(client, args)
    const loadingMore = fetchMore()
    await nextPageRequested
    mocked.getCompressedCollectablesByCreator.mockClear()

    let refreshed: Promise<void> | undefined
    try {
      refreshed = refreshHotspots(client, args)
    } finally {
      releaseNextPage()
    }
    await refreshed
    await loadingMore

    expect(requestedPages()).toEqual([[1, 20]])
    expect(pagesData()?.pageParams).toEqual([0])
    expect(pagesData()?.pages).toHaveLength(1)
    expect(pagesData()?.pages[0].items).toEqual(makeHotspots(20))
  })

  // Pins the await on cancelQueries: refresh starts no first-page fetch until
  // the cancelled next page has settled
  it('refresh waits for the cancelled next page before it fetches again', async () => {
    ownHotspots(45)
    const servePage = mocked.getCompressedCollectablesByCreator
      .getMockImplementation()
      ?.bind(null)
    let releaseNextPage: () => void = () => {}
    let nextPageStarted: () => void = () => {}
    const nextPageRequested = new Promise<void>((resolve) => {
      nextPageStarted = resolve
    })
    mocked.getCompressedCollectablesByCreator.mockImplementation(
      async (pubKey, provider, page, limit) => {
        if (!servePage) throw new Error('no page mock')
        if (page === 2 && limit === 20) {
          nextPageStarted()
          await new Promise<void>((resolve) => {
            releaseNextPage = resolve
          })
        }
        return servePage(pubKey, provider, page, limit)
      },
    )
    await refreshHotspots(client, args)
    const loadingMore = fetchMore()
    await nextPageRequested

    let refreshed: Promise<void> | undefined
    try {
      refreshed = refreshHotspots(client, args)
      expect(
        client.getQueryState(hotspotsQueryOptions(args).queryKey)?.fetchStatus,
      ).toBe('idle')
    } finally {
      releaseNextPage()
      await refreshed
      await loadingMore
    }
    expect(pagesData()?.pages).toHaveLength(1)
  })

  it('shows no hotspots and an ended list before the first fetch', () => {
    expect(selectHotspots(undefined, undefined, false, false)).toEqual({
      hotspots: [],
      hotspotsWithMeta: [],
      totalHotspots: undefined,
      onEndReached: true,
    })
  })

  it('ends the list after a full page when the full list failed', () => {
    const fullPage = {
      pages: [
        {
          items: makeHotspots(20),
          grandTotal: 45,
          metadata: [],
          rewards: [],
          recipients: [],
        },
      ],
      pageParams: [0],
    }

    expect(selectHotspots(fullPage, undefined, true, false).onEndReached).toBe(
      true,
    )
    expect(selectHotspots(fullPage, undefined, false, false).onEndReached).toBe(
      false,
    )
  })

  it('keeps the list open when the first page failed', () => {
    expect(selectHotspots(undefined, undefined, false, true).onEndReached).toBe(
      false,
    )
    expect(selectHotspots(undefined, undefined, true, true).onEndReached).toBe(
      true,
    )
  })

  it('rejects both fetches without a Solana connection', async () => {
    const noProvider = { ...args, anchorProvider: undefined }

    await expect(
      client.fetchInfiniteQuery(hotspotsQueryOptions(noProvider)),
    ).rejects.toThrow('Solana connection missing')
    await expect(
      client.fetchQuery(allHotspotsQueryOptions(noProvider)),
    ).rejects.toThrow('Solana connection missing')
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('useHotspots', () => {
  let hook: ReturnType<typeof useHotspots>
  let renderer: ReactTestRenderer

  // Fetches the full list whenever the list has not ended, like the map
  const MapHarness = () => {
    hook = useHotspots()
    const { loading, onEndReached, fetchAll } = hook
    useEffect(() => {
      if (!loading && !onEndReached) fetchAll()
    }, [loading, onEndReached, fetchAll])
    return null
  }

  const ListHarness = () => {
    hook = useHotspots()
    return null
  }

  const mount = async (harness: () => null) => {
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(harness),
        ),
      )
    })
  }

  const advance = async (ms: number) => {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(ms)
    })
  }

  const fullListRequests = () =>
    requestedPages().filter(([, limit]) => limit === 1000)

  beforeEach(() => {
    jest.useFakeTimers()
    client.setDefaultOptions({
      queries: { ...client.getDefaultOptions().queries, retry: false },
    })
  })

  afterEach(async () => {
    await act(async () => {
      renderer.unmount()
    })
    jest.useRealTimers()
  })

  it('fetches the full list once and ends the list when it fails', async () => {
    ownHotspots(45)
    const servePage = mocked.getCompressedCollectablesByCreator
      .getMockImplementation()
      ?.bind(null)
    mocked.getCompressedCollectablesByCreator.mockImplementation(
      async (pubKey, provider, page, limit) => {
        if (limit === 1000) throw new Error('full list failed')
        if (!servePage) throw new Error('no page mock')
        return servePage(pubKey, provider, page, limit)
      },
    )
    await mount(MapHarness)

    await act(async () => {
      hook.refresh()
    })
    await advance(100)

    expect(fullListRequests()).toHaveLength(1)
    expect(hook.onEndReached).toBe(true)
  })

  it('fetches the full list once when the first page fails', async () => {
    ownHotspots(45)
    const servePage = mocked.getCompressedCollectablesByCreator
      .getMockImplementation()
      ?.bind(null)
    mocked.getCompressedCollectablesByCreator.mockImplementation(
      async (pubKey, provider, page, limit) => {
        if (limit === 20) throw new Error('first page failed')
        if (!servePage) throw new Error('no page mock')
        return servePage(pubKey, provider, page, limit)
      },
    )
    await mount(ListHarness)
    await act(async () => {
      hook.refresh()
    })
    await advance(100)
    await act(async () => {
      renderer.unmount()
    })

    await mount(MapHarness)
    await advance(100)

    expect(fullListRequests()).toHaveLength(1)
    expect(hook.onEndReached).toBe(true)
    expect(hook.hotspots.map(({ id }) => id)).toEqual(
      makeHotspots(45).map(({ id }) => id),
    )
  })

  it('starts no next page while the full list loads', async () => {
    ownHotspots(45)
    const servePage = mocked.getCompressedCollectablesByCreator
      .getMockImplementation()
      ?.bind(null)
    let resolveFullList: () => void = () => {}
    mocked.getCompressedCollectablesByCreator.mockImplementation(
      async (pubKey, provider, page, limit) => {
        if (!servePage) throw new Error('no page mock')
        if (limit === 1000) {
          await new Promise<void>((resolve) => {
            resolveFullList = resolve
          })
        }
        return servePage(pubKey, provider, page, limit)
      },
    )
    await mount(ListHarness)
    await act(async () => {
      hook.refresh()
    })
    await advance(100)
    expect(hook.onEndReached).toBe(false)

    try {
      await act(async () => {
        hook.fetchAll()
      })
      await advance(0)
      expect(hook.loading).toBe(true)

      await act(async () => {
        hook.fetchMore()
      })
      await advance(0)
      expect(requestedPages().filter(([, limit]) => limit === 20)).toEqual([
        [1, 20],
      ])
    } finally {
      resolveFullList()
      await advance(100)
    }
  })

  it('starts no fetch while the first page loads', async () => {
    ownHotspots(45)
    mocked.getCompressedCollectablesByCreator.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                items: makeHotspots(20),
                grandTotal: 45,
              } as Awaited<
                ReturnType<typeof solUtils.getCompressedCollectablesByCreator>
              >),
            100,
          )
        }),
    )
    await mount(ListHarness)

    await act(async () => {
      hook.refresh()
    })
    await advance(0)
    expect(hook.loading).toBe(true)
    expect(mocked.getCompressedCollectablesByCreator).toHaveBeenCalledTimes(1)

    await act(async () => {
      hook.fetchMore()
      hook.fetchAll()
    })
    await advance(0)
    expect(mocked.getCompressedCollectablesByCreator).toHaveBeenCalledTimes(1)

    await advance(100)
  })

  it('opens the list on the mounted hook after the first page fails', async () => {
    ownHotspots(45)
    const servePage = mocked.getCompressedCollectablesByCreator
      .getMockImplementation()
      ?.bind(null)
    mocked.getCompressedCollectablesByCreator.mockImplementation(
      async (pubKey, provider, page, limit) => {
        if (limit === 20) throw new Error('first page failed')
        if (!servePage) throw new Error('no page mock')
        return servePage(pubKey, provider, page, limit)
      },
    )
    await mount(ListHarness)
    expect(hook.onEndReached).toBe(true)

    await act(async () => {
      hook.refresh()
    })
    await advance(100)

    expect(requestedPages()).toEqual([[1, 20]])
    expect(hook.onEndReached).toBe(false)
  })
})
