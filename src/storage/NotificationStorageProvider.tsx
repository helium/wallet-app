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

const useNotificationStorageHook = () => {
  const [selectedList, setSelectedList] = useState<string>(WALLET_UPDATES_ITEM)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification>()
  const [openedNotification, setOpenedNotification] = useState<OSNotification>()

  useAsync(async () => {
    try {
      const nextSelectedList = await getSecureItem('selected_list')

      if (nextSelectedList) {
        setSelectedList(nextSelectedList)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const updateSelectedList = useCallback(async (nextSelectedList: string) => {
    setSelectedList(nextSelectedList)
    storeSecureItem('selected_list', nextSelectedList)
  }, [])

  return {
    selectedList,
    updateSelectedList,
    selectedNotification,
    setSelectedNotification,
    openedNotification,
    setOpenedNotification,
  }
}

const initialState = {
  selectedList: WALLET_UPDATES_ITEM,
  updateSelectedList: async () => undefined,
  selectedNotification: undefined,
  setSelectedNotification: () => undefined,
  openedNotification: undefined,
  setOpenedNotification: () => undefined,
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
