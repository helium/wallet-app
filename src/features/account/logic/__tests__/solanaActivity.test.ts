import { InfiniteQueryObserver } from '@tanstack/react-query'
import { SignaturesForAddressOptions } from '@solana/web3.js'
import { DC_MINT } from '@helium/spl-utils'
import { createQueryClient } from '../../../../utils/queryClient'
import { Activity } from '../../../../types/activity'
import {
  filterActivity,
  solanaActivityQuery,
  updateActivityHead,
} from '../solanaActivity'

const ADDRESS = 'owner1111111111111111111111111111111111111'
const MINT = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'

const txns = (...hashes: string[]): Activity[] =>
  hashes.map((hash) => ({ hash, type: 'payment' }))

const hashes = (pages?: Activity[][]) =>
  pages?.map((page) => page.map(({ hash }) => hash))

const setup = (...responses: Activity[][]) => {
  const queryClient = createQueryClient()
  const fetchActivity = jest.fn()
  responses.forEach((r) => fetchActivity.mockResolvedValueOnce(r))
  const options = solanaActivityQuery({
    address: ADDRESS,
    mint: MINT,
    fetchActivity,
  })
  return { queryClient, fetchActivity, options }
}

describe('solanaActivityQuery', () => {
  it('reads the newest 20 transactions, then pages before the oldest one', async () => {
    const { queryClient, fetchActivity, options } = setup(
      txns('c', 'b'),
      txns('a'),
    )
    const observer = new InfiniteQueryObserver(queryClient, options)

    await observer.refetch()
    const result = await observer.fetchNextPage()

    expect(fetchActivity).toHaveBeenNthCalledWith(1, { limit: 20 })
    expect(fetchActivity).toHaveBeenNthCalledWith(2, {
      limit: 20,
      before: 'b',
    })
    expect(hashes(result.data?.pages)).toEqual([['c', 'b'], ['a']])
    queryClient.clear()
  })

  it('has no next page after an empty page', async () => {
    const { queryClient, options } = setup(txns('a'), [])
    const observer = new InfiniteQueryObserver(queryClient, options)

    await observer.refetch()
    expect(observer.getCurrentResult().hasNextPage).toBe(true)
    const result = await observer.fetchNextPage()

    expect(result.hasNextPage).toBe(false)
    queryClient.clear()
  })

  it('keeps activity apart per wallet and mint', () => {
    const fetchActivity = jest.fn()
    const key = (address: string, mint: string) =>
      solanaActivityQuery({ address, mint, fetchActivity }).queryKey

    expect(key(ADDRESS, MINT)).not.toEqual(key('other', MINT))
    expect(key(ADDRESS, MINT)).not.toEqual(key(ADDRESS, 'other'))
  })
})

describe('updateActivityHead', () => {
  it('prepends transactions newer than the newest one shown', async () => {
    const { queryClient, fetchActivity, options } = setup(
      txns('c', 'b'),
      txns('a'),
      txns('e', 'd'),
    )
    const observer = new InfiniteQueryObserver(queryClient, options)
    await observer.refetch()
    await observer.fetchNextPage()

    await updateActivityHead(queryClient, options, fetchActivity)

    expect(fetchActivity).toHaveBeenLastCalledWith({ limit: 20, until: 'c' })
    expect(hashes(queryClient.getQueryData(options.queryKey)?.pages)).toEqual([
      ['e', 'd', 'c', 'b'],
      ['a'],
    ])
    queryClient.clear()
  })

  it('adds each transaction once when two updates get the same head', async () => {
    const { queryClient, fetchActivity, options } = setup(
      txns('c', 'b'),
      txns('e', 'd'),
      txns('e', 'd'),
    )
    const observer = new InfiniteQueryObserver(queryClient, options)
    await observer.refetch()

    await Promise.all([
      updateActivityHead(queryClient, options, fetchActivity),
      updateActivityHead(queryClient, options, fetchActivity),
    ])

    expect(hashes(queryClient.getQueryData(options.queryKey)?.pages)).toEqual([
      ['e', 'd', 'c', 'b'],
    ])
    queryClient.clear()
  })

  it('keeps the new head and the next page when both are in flight', async () => {
    // Newest first. More than one page, so fetchNextPage reads a real page.
    const older = Array.from({ length: 30 }, (_, i) => `old${i}`)
    let chain = older
    // Each call answers from the chain as it is at call time, and waits
    // until the test lets it resolve.
    const calls: Array<{
      options: SignaturesForAddressOptions
      resolve: () => void
    }> = []
    const fetchActivity = jest.fn(
      (opts: SignaturesForAddressOptions) =>
        new Promise<Activity[]>((resolve) => {
          const start = opts.before ? chain.indexOf(opts.before) + 1 : 0
          const end = opts.until ? chain.indexOf(opts.until) : chain.length
          const answer = txns(...chain.slice(start, end).slice(0, opts.limit))
          calls.push({ options: opts, resolve: () => resolve(answer) })
        }),
    )
    const resolveCall = (
      match: (o: SignaturesForAddressOptions) => boolean,
    ) => {
      const index = calls.findIndex((call) => match(call.options))
      calls.splice(index, 1)[0].resolve()
    }
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
    const queryClient = createQueryClient()
    const options = solanaActivityQuery({
      address: ADDRESS,
      mint: MINT,
      fetchActivity,
    })
    const settle = async () => {
      await tick()
      while (calls.length || queryClient.isFetching()) {
        calls.shift()?.resolve()
        // eslint-disable-next-line no-await-in-loop
        await tick()
      }
    }
    const observer = new InfiniteQueryObserver(queryClient, options)
    const unsubscribe = observer.subscribe(() => {})
    await settle()

    chain = ['new1', 'new0', ...older]
    const nextPage = observer.fetchNextPage()
    const update = updateActivityHead(queryClient, options, fetchActivity)
    await tick()
    resolveCall((o) => o.until !== undefined)
    await settle()
    await Promise.all([nextPage, update])

    const shown = hashes(queryClient.getQueryData(options.queryKey)?.pages)
    const flat = shown?.flat() ?? []
    expect(flat).toEqual(chain)
    unsubscribe()
    queryClient.clear()
  })

  it('keeps the new head when the next page in flight fails', async () => {
    const older = Array.from({ length: 30 }, (_, i) => `old${i}`)
    let chain = older
    // Each call answers from the chain as it is at call time, and waits
    // until the test lets it settle. A next page read fails.
    const calls: Array<{
      options: SignaturesForAddressOptions
      resolve: () => void
    }> = []
    const fetchActivity = jest.fn(
      (opts: SignaturesForAddressOptions) =>
        new Promise<Activity[]>((resolve, reject) => {
          const start = opts.before ? chain.indexOf(opts.before) + 1 : 0
          const end = opts.until ? chain.indexOf(opts.until) : chain.length
          const answer = txns(...chain.slice(start, end).slice(0, opts.limit))
          calls.push({
            options: opts,
            resolve: () =>
              opts.before
                ? reject(new Error('next page failed'))
                : resolve(answer),
          })
        }),
    )
    const resolveCall = (
      match: (o: SignaturesForAddressOptions) => boolean,
    ) => {
      const index = calls.findIndex((call) => match(call.options))
      calls.splice(index, 1)[0].resolve()
    }
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
    const queryClient = createQueryClient()
    const options = solanaActivityQuery({
      address: ADDRESS,
      mint: MINT,
      fetchActivity,
    })
    const settle = async () => {
      await tick()
      while (calls.length || queryClient.isFetching()) {
        calls.shift()?.resolve()
        // eslint-disable-next-line no-await-in-loop
        await tick()
      }
    }
    const observer = new InfiniteQueryObserver(queryClient, {
      ...options,
      retry: false,
    })
    const unsubscribe = observer.subscribe(() => {})
    await settle()

    chain = ['new1', 'new0', ...older]
    const nextPage = observer.fetchNextPage()
    const update = updateActivityHead(queryClient, options, fetchActivity)
    await tick()
    resolveCall((o) => o.until !== undefined)
    await settle()
    await nextPage

    await expect(update).resolves.toBeUndefined()
    const shown = hashes(queryClient.getQueryData(options.queryKey)?.pages)
    expect(shown?.flat()).toEqual(['new1', 'new0', ...older.slice(0, 20)])
    unsubscribe()
    queryClient.clear()
  })

  it('does nothing before the first page has loaded', async () => {
    const { queryClient, fetchActivity, options } = setup()

    await updateActivityHead(queryClient, options, fetchActivity)

    expect(fetchActivity).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined()
  })
})

describe('filterActivity', () => {
  const ME = 'me111111111111111111111111111111111111111'
  const OTHER = 'other1111111111111111111111111111111111111'
  const OTHER_MINT = 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6'
  const send: Activity = {
    hash: 'send',
    type: 'payment',
    payments: [
      { owner: ME, amount: -5, mint: MINT },
      { owner: OTHER, amount: 5, mint: MINT },
    ],
  }
  const receive: Activity = {
    hash: 'receive',
    type: 'payment',
    payments: [{ owner: ME, amount: 5, mint: MINT }],
  }
  const otherMint: Activity = {
    hash: 'otherMint',
    type: 'payment',
    payments: [{ owner: ME, amount: 5, mint: OTHER_MINT }],
  }
  const activity = [send, receive, otherMint]
  const shown = (filter: 'all' | 'in' | 'out') =>
    filterActivity(activity, { filter, mint: MINT, owner: ME }).map(
      ({ hash }) => hash,
    )

  it('shows a send under out only', () => {
    expect(shown('out')).toEqual(['send'])
  })

  it('shows a receive under in only', () => {
    expect(shown('in')).toEqual(['receive'])
  })

  it('shows a payment of another mint under neither in nor out', () => {
    expect(shown('in')).not.toContain('otherMint')
    expect(shown('out')).not.toContain('otherMint')
  })

  it('shows everything under all', () => {
    expect(shown('all')).toEqual(['send', 'receive', 'otherMint'])
  })

  it.each(['delegate', 'mint'] as const)(
    'shows every activity under %s for the DC mint',
    (filter) => {
      expect(
        filterActivity(activity, {
          filter,
          mint: DC_MINT.toBase58(),
          owner: ME,
        }),
      ).toEqual(activity)
    },
  )

  it.each(['delegate', 'mint'] as const)(
    'shows nothing under %s for a non-DC mint',
    (filter) => {
      expect(
        filterActivity(activity, { filter, mint: MINT, owner: ME }),
      ).toEqual([])
    },
  )
})
