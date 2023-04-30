import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { OSNotification } from 'react-native-onesignal'
import { heliumAddressToSolAddress } from '@helium/spl-utils'
import { useSelector } from 'react-redux'
import { orderBy, without } from 'lodash'
import {
  HELIUM_UPDATES_ITEM,
  WALLET_UPDATES_ITEM,
} from '../features/notifications/notificationTypes'
import { useAppDispatch } from '../store/store'
import { getNotifications } from '../store/slices/notificationsSlice'
import usePrevious from '../hooks/usePrevious'
import { RootState } from '../store/rootReducer'
import { useAccountStorage } from './AccountStorageProvider'
import { Notification } from '../utils/walletApiV2'

const useNotificationStorageHook = () => {
  const [selectedList, setSelectedList] = useState<string>()
  const prevSelectedList = usePrevious(selectedList)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification>()
  const [openedNotification, setOpenedNotification] = useState<OSNotification>()
  const [unreadLists, setUnreadLists] = useState<string[]>([])
  const dispatch = useAppDispatch()
  const notificationsByResource = useSelector(
    (appState: RootState) => appState.notifications.notifications,
  )
  const { currentAccount, sortedAccounts } = useAccountStorage()

  useEffect(() => {
    if (!currentAccount?.address) return
    setSelectedList(currentAccount.address)
  }, [currentAccount?.address])

  const apiResource = useMemo(() => {
    try {
      return heliumAddressToSolAddress(selectedList || '')
    } catch {
      return selectedList || ''
    }
  }, [selectedList])

  const notifications = useMemo(() => {
    const unsorted = notificationsByResource[apiResource || ''] || []
    return orderBy(unsorted, [(n) => new Date(n.createdAt)], ['desc'])
  }, [notificationsByResource, apiResource])

  const currentResources = useMemo(() => {
    const all = [WALLET_UPDATES_ITEM, HELIUM_UPDATES_ITEM]
    if (apiResource && !all.includes(apiResource)) {
      all.push(apiResource)
    }

    return all
  }, [apiResource])

  const updateNotifications = useCallback(() => {
    if (prevSelectedList === selectedList) return
    currentResources.map((r) =>
      dispatch(
        getNotifications({
          resource: r,
          wallet: currentAccount?.solanaAddress,
        }),
      ),
    )
  }, [
    currentAccount?.solanaAddress,
    currentResources,
    dispatch,
    prevSelectedList,
    selectedList,
  ])

  const updateAllNotifications = useCallback(() => {
    const all = without(
      [
        ...sortedAccounts.map(({ solanaAddress }) => solanaAddress),
        HELIUM_UPDATES_ITEM,
        WALLET_UPDATES_ITEM,
      ],
      undefined,
    ) as string[]

    all.map((r) =>
      dispatch(
        getNotifications({
          resource: r,
          wallet: currentAccount?.solanaAddress,
        }),
      ),
    )
  }, [currentAccount?.solanaAddress, dispatch, sortedAccounts])

  useEffect(() => {
    updateNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedList])

  useEffect(() => {
    const interval = setInterval(() => {
      updateNotifications()
    }, 60000 * 5) // Every 5 mins
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
