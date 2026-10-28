import { InfiniteQueryObserver } from '@tanstack/react-query'
import { createQueryClient } from '../../../../utils/queryClient'
import { Activity } from '../../../../types/activity'
import { solanaActivityQuery, updateActivityHead } from '../solanaActivity'

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

  it('does nothing before the first page has loaded', async () => {
    const { queryClient, fetchActivity, options } = setup()

    await updateActivityHead(queryClient, options, fetchActivity)

    expect(fetchActivity).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined()
  })
})
