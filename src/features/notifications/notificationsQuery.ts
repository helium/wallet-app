import { QueryClient, queryOptions } from '@tanstack/react-query'
import { getNotifications, Notification } from '../../utils/walletApiV2'

export const notificationsQueryKey = (resource: string, wallet?: string) =>
  ['notifications', resource, wallet] as const

export const NOTIFICATIONS_REFETCH_INTERVAL_MS = 5 * 60_000

// Not persisted: notifications always refetch on launch, once a wallet is known.
export const notificationsQuery = (resource: string, wallet?: string) =>
  queryOptions({
    queryKey: notificationsQueryKey(resource, wallet),
    queryFn: () => getNotifications({ resource, wallet }),
    enabled: !!wallet,
  })

export const markNotificationViewed = (
  queryClient: QueryClient,
  resource: string,
  id: number,
  viewedAt: string,
) =>
  queryClient.setQueriesData<Notification[]>(
    { queryKey: ['notifications', resource] },
    (notifications) =>
      notifications?.map((n) => (n.id === id ? { ...n, viewedAt } : n)),
  )
