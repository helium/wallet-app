import { QueryClient, infiniteQueryOptions } from '@tanstack/react-query'
import { DC_MINT } from '@helium/spl-utils'
import { SignaturesForAddressOptions } from '@solana/web3.js'
import { last } from 'lodash'
import { Activity } from '../../../types/activity'
import { FilterType } from '../AccountActivityFilter'

export type FetchActivity = (
  options: SignaturesForAddressOptions,
) => Promise<Activity[]>

const PAGE_SIZE = 20

/** Newest first; each next page reads the transactions before the oldest one. */
export const solanaActivityQuery = ({
  address,
  mint,
  fetchActivity,
}: {
  address?: string
  mint: string
  fetchActivity: FetchActivity
}) =>
  infiniteQueryOptions({
    queryKey: ['solanaActivity', address, mint],
    queryFn: ({ pageParam }) =>
      fetchActivity({ limit: PAGE_SIZE, before: pageParam }),
    initialPageParam: undefined as string | undefined,
    // An empty page means there is no older transaction to page from
    getNextPageParam: (lastPage) => last(lastPage)?.hash,
  })

/** Prepends the transactions newer than the newest one in the cache. */
export const updateActivityHead = async (
  queryClient: QueryClient,
  { queryKey }: ReturnType<typeof solanaActivityQuery>,
  fetchActivity: FetchActivity,
) => {
  const newest = queryClient.getQueryData(queryKey)?.pages[0]?.[0]
  if (!newest) return

  const head = await fetchActivity({ limit: PAGE_SIZE, until: newest.hash })
  // A fetch in flight builds its pages from the data it read at its start, so
  // it would overwrite the prepend. Wait for it to land, then prepend.
  const query = queryClient.getQueryCache().find({ queryKey })
  while (query?.promise && query.state.fetchStatus === 'fetching') {
    // eslint-disable-next-line no-await-in-loop
    await query.promise.catch(() => undefined)
  }
  queryClient.setQueryData(queryKey, (data) => {
    if (!data) return data
    // Another head update may have prepended these already
    const shown = new Set(data.pages[0].map(({ hash }) => hash))
    const fresh = head.filter(({ hash }) => !shown.has(hash))
    return {
      ...data,
      pages: [[...fresh, ...data.pages[0]], ...data.pages.slice(1)],
    }
  })
}

/** The activity to show for a filter, a mint and the wallet that owns it. */
export const filterActivity = (
  activity: Activity[],
  { filter, mint, owner }: { filter: FilterType; mint: string; owner: string },
) => {
  if (
    mint === DC_MINT.toBase58() &&
    (filter === 'delegate' || filter === 'mint')
  ) {
    return activity
  }

  if (filter !== 'in' && filter !== 'out' && filter !== 'all') return []
  if (filter === 'in' || filter === 'out') {
    return activity.filter((txn) =>
      txn.payments?.some(
        (payment) =>
          payment.mint === mint &&
          payment.owner === owner &&
          (filter === 'out' ? payment.amount < 0 : payment.amount > 0),
      ),
    )
  }

  return activity
}
