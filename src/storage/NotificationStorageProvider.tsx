import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import { OSNotification } from 'react-native-onesignal'
import { without } from 'lodash'
import { heliumAddressToSolAddress } from '@helium/spl-utils'
import {
  HELIUM_UPDATES_ITEM,
  WALLET_UPDATES_ITEM,
} from '../features/notifications/notificationTypes'
import { Notification } from '../generated/graphql'
import { getSecureItem, storeSecureItem } from './secureStorage'
import {
  getLastViewedNotifications,
  updateLastViewedNotifications,
} from './cloudStorage'
import { useAccountStorage } from './AccountStorageProvider'
import { useAppDispatch } from '../store/store'
import { getNotifications } from '../store/slices/notificationsSlice'

const useNotificationStorageHook = () => {
  const [selectedList, setSelectedList] = useState<string>(WALLET_UPDATES_ITEM)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification>()
  const [openedNotification, setOpenedNotification] = useState<OSNotification>()
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>()
  const [unreadLists, setUnreadLists] = useState<string[]>([])
  const { sortedAccounts } = useAccountStorage()
  const dispatch = useAppDispatch()

  const allResources = useMemo(() => {
    const networkData = [WALLET_UPDATES_ITEM, HELIUM_UPDATES_ITEM]
    const solanaAddresses = without(
      sortedAccounts.map(({ solanaAddress }) => solanaAddress),
      undefined,
    ) as string[]
    return [...networkData, ...solanaAddresses]
  }, [sortedAccounts])

  const resource = useMemo(() => {
    try {
      return heliumAddressToSolAddress(selectedList)
    } catch {
      return selectedList
    }
  }, [selectedList])

  const updateNotifications = useCallback(() => {
    // TODO: Someday we could update the wallet api to take a list of resources to cut down on api calls
    // TODO: Dedup these calls
    // eslint-disable-next-line no-console
    console.log('update notifications..........................')
    allResources.map((r) => dispatch(getNotifications({ resource: r })))
  }, [allResources, dispatch])

  useEffect(() => {
    updateNotifications()
  }, [updateNotifications])

  useEffect(() => {
    const interval = setInterval(() => {
      updateNotifications()
    }, 60000 * 5) // Every 5 mins
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    updateNotifications,
    resource,
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
  updateNotifications: () => undefined,
  resource: '',
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
