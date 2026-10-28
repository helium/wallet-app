import { QueryClient, queryOptions } from '@tanstack/react-query'
import { getNotifications, Notification } from '../../utils/walletApiV2'

export const notificationsQueryKey = (resource: string, wallet?: string) =>
  ['notifications', resource, wallet] as const

// Not persisted: notifications always refetch on launch.
export const notificationsQuery = (resource: string, wallet?: string) =>
  queryOptions({
    queryKey: notificationsQueryKey(resource, wallet),
    queryFn: () => getNotifications({ resource, wallet }),
    refetchInterval: 5 * 60_000,
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
