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

// Global notification sync guard to prevent overlapping requests
let isNotificationSyncing = false
let lastNotificationSyncKey = ''
let notificationCooldownTimer: ReturnType<typeof setTimeout> | null = null

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

    const syncKey = `${currentAccount?.solanaAddress}-${selectedList}`

    // Check if sync is already in progress
    if (isNotificationSyncing) {
      return
    }

    // Check cooldown (5 seconds)
    if (lastNotificationSyncKey === syncKey) {
      return
    }

    isNotificationSyncing = true
    lastNotificationSyncKey = syncKey

    // Clear any existing cooldown timer
    if (notificationCooldownTimer) {
      clearTimeout(notificationCooldownTimer)
    }

    // Batch all notification requests with a small delay between each
    currentResources.forEach((r, index) => {
      setTimeout(() => {
        dispatch(
          getNotifications({
            resource: r,
            wallet: currentAccount?.solanaAddress,
          }),
        ).finally(() => {
          // Only reset sync flag after the last request
          if (index === currentResources.length - 1) {
            isNotificationSyncing = false

            // Set cooldown for 5 seconds
            notificationCooldownTimer = setTimeout(() => {
              lastNotificationSyncKey = ''
              notificationCooldownTimer = null
            }, 5000)
          }
        })
      }, index * 200) // 200ms between each request
    })
  }, [
    currentAccount?.solanaAddress,
    currentResources,
    dispatch,
    prevSelectedList,
    selectedList,
  ])

  const updateAllNotifications = useCallback(() => {
    // Check if sync is already in progress
    if (isNotificationSyncing) {
      return
    }

    const all = without(
      [
        ...sortedAccounts.map(({ solanaAddress }) => solanaAddress),
        HELIUM_UPDATES_ITEM,
        WALLET_UPDATES_ITEM,
      ],
      undefined,
    ) as string[]

    isNotificationSyncing = true

    // Batch all notification requests with delays
    all.forEach((r, index) => {
      setTimeout(() => {
        dispatch(
          getNotifications({
            resource: r,
            wallet: currentAccount?.solanaAddress,
          }),
        ).finally(() => {
          // Only reset sync flag after the last request
          if (index === all.length - 1) {
            isNotificationSyncing = false
          }
        })
      }, index * 300) // 300ms between each request for bulk updates
    })
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
