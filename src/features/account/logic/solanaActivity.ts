import { QueryClient, infiniteQueryOptions } from '@tanstack/react-query'
import { SignaturesForAddressOptions } from '@solana/web3.js'
import { last } from 'lodash'
import { Activity } from '../../../types/activity'

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
  queryClient.setQueryData(
    queryKey,
    (data) =>
      data && {
        ...data,
        pages: [[...head, ...data.pages[0]], ...data.pages.slice(1)],
      },
  )
}
