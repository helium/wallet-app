import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { OSNotification } from 'react-native-onesignal'
import { heliumAddressToSolAddress } from '@helium/spl-utils'
import { useMutation, useQueries } from '@tanstack/react-query'
import { orderBy, uniq, without } from 'lodash'
import {
  HELIUM_UPDATES_ITEM,
  WALLET_UPDATES_ITEM,
} from '../features/notifications/notificationTypes'
import {
  markNotificationViewed,
  NOTIFICATIONS_REFETCH_INTERVAL_MS,
  notificationsQuery,
} from '../features/notifications/notificationsQuery'
import { useAccountStorage } from './AccountStorageProvider'
import { Notification, postNotificationRead } from '../utils/walletApiV2'
import { queryClient } from '../utils/queryClient'

const useNotificationStorageHook = () => {
  const [selectedList, setSelectedList] = useState<string>()
  const [selectedNotification, setSelectedNotification] =
    useState<Notification>()
  const [openedNotification, setOpenedNotification] = useState<OSNotification>()
  const [unreadLists, setUnreadLists] = useState<string[]>([])
  const { currentAccount, sortedAccounts } = useAccountStorage()

  const [prevAddress, setPrevAddress] = useState<string>()
  if (prevAddress !== currentAccount?.address) {
    setPrevAddress(currentAccount?.address)
    if (currentAccount?.address) {
      setSelectedList(currentAccount.address)
    }
  }

  const apiResource = useMemo(() => {
    try {
      return heliumAddressToSolAddress(selectedList || '')
    } catch {
      return selectedList || ''
    }
  }, [selectedList])

  const currentResources = useMemo(() => {
    const all = [WALLET_UPDATES_ITEM, HELIUM_UPDATES_ITEM]
    if (apiResource && !all.includes(apiResource)) {
      all.push(apiResource)
    }

    return all
  }, [apiResource])

  const resources = uniq([
    ...currentResources,
    ...(without(
      sortedAccounts.map(({ solanaAddress }) => solanaAddress),
      undefined,
    ) as string[]),
  ])

  // Outside QueryClientProvider, so the client is passed in. Every account
  // fetches at launch, so the home unread dot covers all wallets. Only the
  // current resources poll; other accounts refetch on updateAllNotifications.
  const notificationQueries = useQueries(
    {
      queries: resources.map((r) => ({
        ...notificationsQuery(r, currentAccount?.solanaAddress),
        refetchInterval: currentResources.includes(r)
          ? NOTIFICATIONS_REFETCH_INTERVAL_MS
          : false,
      })),
    },
    queryClient,
  )

  const notificationsByResource: Record<string, Notification[]> = {}
  resources.forEach((r, i) => {
    const { data } = notificationQueries[i]
    if (data) notificationsByResource[r] = data
  })

  const notifications = orderBy(
    notificationsByResource[apiResource] || [],
    [(n) => new Date(n.createdAt)],
    ['desc'],
  )

  const updateAllNotifications = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }, [])

  const { mutate: markNotificationRead } = useMutation(
    {
      mutationFn: ({ id, resource }: { id: number; resource: string }) =>
        postNotificationRead({ id, resource, accounts: sortedAccounts }),
      onSuccess: (_, { id, resource }) =>
        markNotificationViewed(
          queryClient,
          resource,
          id,
          new Date().toISOString(),
        ),
    },
    queryClient,
  )

  const updateSelectedList = useCallback(
    (nextSelectedList: string) => {
      if (selectedList === nextSelectedList) return
      setSelectedList(nextSelectedList)
    },
    [selectedList],
  )

  const markListUnread = useCallback(
    (list: string) => {
      setUnreadLists([...unreadLists, list])
    },
    [unreadLists],
  )

  return {
    apiResource,
    markListUnread,
    markNotificationRead,
    notifications,
    notificationsByResource,
    openedNotification,
    selectedList,
    selectedNotification,
    setOpenedNotification,
    setSelectedNotification,
    unreadLists,
    updateAllNotifications,
    updateSelectedList,
  }
}

const initialState = {
  apiResource: '',
  lastViewedTimestamp: undefined,
  markListUnread: () => undefined,
  markNotificationRead: () => undefined,
  notifications: [],
  notificationsByResource: {},
  onNotificationsClosed: async () => undefined,
  openedNotification: undefined,
  selectedList: WALLET_UPDATES_ITEM,
  selectedNotification: undefined,
  setOpenedNotification: () => undefined,
  setSelectedNotification: () => undefined,
  unreadLists: [],
  updateAllNotifications: () => undefined,
  updateSelectedList: async () => undefined,
}
const NotificationStorageContext =
  createContext<ReturnType<typeof useNotificationStorageHook>>(initialState)
const { Provider } = NotificationStorageContext

const NotificationStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useNotificationStorageHook()}>{children}</Provider>
}

export const useNotificationStorage = () =>
  useContext(NotificationStorageContext)

export default NotificationStorageProvider
