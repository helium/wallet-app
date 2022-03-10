import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import { OSNotification } from 'react-native-onesignal'
import { WALLET_UPDATES_ITEM } from '../features/notifications/notificationTypes'
import { Notification } from '../generated/graphql'
import { getSecureItem, storeSecureItem } from './secureStorage'
import {
  getLastViewedNotifications,
  updateLastViewedNotifications,
} from './cloudStorage'

const useNotificationStorageHook = () => {
  const [selectedList, setSelectedList] = useState<string>(WALLET_UPDATES_ITEM)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification>()
  const [openedNotification, setOpenedNotification] = useState<OSNotification>()
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>()
  const [unreadLists, setUnreadLists] = useState<string[]>([])

  useAsync(async () => {
    try {
      const nextSelectedList = await getSecureItem('selected_list')
      const nextLastViewedTimestamp = await getLastViewedNotifications()

      if (nextSelectedList) {
        setSelectedList(nextSelectedList)
      }
      if (nextLastViewedTimestamp) {
        setLastViewedTimestamp(nextLastViewedTimestamp)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const updateSelectedList = useCallback(async (nextSelectedList: string) => {
    setSelectedList(nextSelectedList)
    await storeSecureItem('selected_list', nextSelectedList)
  }, [])

  const onNotificationsClosed = useCallback(async () => {
    const timestamp = Date.now()
    setLastViewedTimestamp(timestamp)
    setUnreadLists([])
    await updateLastViewedNotifications(timestamp)
  }, [])

  const markListUnread = useCallback(
    (list: string) => {
      setUnreadLists([...unreadLists, list])
    },
    [unreadLists],
  )

  return {
    selectedList,
    updateSelectedList,
    selectedNotification,
    setSelectedNotification,
    openedNotification,
    setOpenedNotification,
    onNotificationsClosed,
    lastViewedTimestamp,
    unreadLists,
    markListUnread,
  }
}

const initialState = {
  selectedList: WALLET_UPDATES_ITEM,
  updateSelectedList: async () => undefined,
  selectedNotification: undefined,
  setSelectedNotification: () => undefined,
  openedNotification: undefined,
  setOpenedNotification: () => undefined,
  onNotificationsClosed: async () => undefined,
  lastViewedTimestamp: undefined,
  unreadLists: [],
  markListUnread: () => undefined,
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
