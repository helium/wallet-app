import { AnchorProvider } from '@anchor-lang/core'
import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query'
import { CompressedNFT } from '../../types/solana'
import * as solUtils from '../../utils/solanaUtils'
import { createQueryClient } from '../../utils/queryClient'
import {
  allHotspotsQueryOptions,
  hotspotsQueryOptions,
  refreshHotspots,
  selectHotspots,
} from '../useHotspots'

jest.mock('../../solana/SolanaProvider', () => ({}))
jest.mock('../../storage/AccountStorageProvider', () => ({}))
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
      } as unknown as CompressedNFT),
  )

// A wallet that owns `count` hotspots, served by page like the DAS API
const ownHotspots = (count: number) => {
  const owned = makeHotspots(count)
  mocked.getCompressedCollectablesByCreator.mockImplementation(
    async (_pubKey, _provider, page = 1, limit = 1000) =>
      ({
        items: owned.slice((page - 1) * limit, page * limit),
        grandTotal: count,
      } as Awaited<
        ReturnType<typeof solUtils.getCompressedCollectablesByCreator>
      >),
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
  it('loads 20 hotspots a page until a short page ends the list', async () => {
    ownHotspots(45)

    await refreshHotspots(client, args)
    await fetchMore()
    expect(selectHotspots(pagesData(), allData())).toMatchObject({
      totalHotspots: 45,
      onEndReached: false,
    })

    await fetchMore()
    const { hotspots, onEndReached } = selectHotspots(pagesData(), allData())

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

    expect(selectHotspots(pagesData(), allData()).hotspotsWithMeta).toEqual([
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
      selectHotspots(pagesData(), allData())

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
    const { hotspots, onEndReached } = selectHotspots(pagesData(), allData())

    expect(requestedPages()).toEqual([[1, 20]])
    expect(allData()).toBeUndefined()
    expect(hotspots).toHaveLength(20)
    expect(onEndReached).toBe(false)
  })

  it('shows no hotspots and an ended list before the first fetch', () => {
    expect(selectHotspots(undefined, undefined)).toEqual({
      hotspots: [],
      hotspotsWithMeta: [],
      totalHotspots: undefined,
      onEndReached: true,
    })
  })
})
