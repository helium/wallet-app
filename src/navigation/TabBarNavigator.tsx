import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { SvgProps } from 'react-native-svg'
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context'
import Dollar from '@assets/images/dollar.svg'
import Gem from '@assets/images/gem.svg'
import Transactions from '@assets/images/transactions.svg'
import Notifications from '@assets/images/notifications.svg'
import { Portal } from '@gorhom/portal'
import NavBar, { NavBarHeight } from '@components/NavBar'
import { Color } from '@theme/theme'
import SafeAreaBox from '@components/SafeAreaBox'
import Box from '@components/Box'
import useEnrichedTransactions from '@hooks/useEnrichedTransactions'
import useHaptic from '@hooks/useHaptic'
import Globe from '@assets/images/earth-globe.svg'
import { isBefore, parseISO } from 'date-fns'
import { useNotificationStorage } from '@storage/NotificationStorageProvider'
import { useDispatch } from 'react-redux'
import { useGetSolanaStatusQuery } from '../store/slices/solanaStatusApi'
import { useGetNotificationsQuery } from '../store/slices/walletRestApi'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import SolanaMigration from '../features/migration/SolanaMigration'
import HomeNavigator from '../features/home/HomeNavigator'
import CollectablesTabNavigator from '../features/collectables/CollectablesTabNavigator'
import ActivityNavigator from '../features/activity/ActivityNavigator'
import NotificationsNavigator from '../features/notifications/NotificationsNavigator'
import BrowserNavigator from '../features/browser/BrowserNavigator'
import { useNotificationsQuery } from '../generated/graphql'
import { appSlice } from '../store/slices/appSlice'

const Tab = createBottomTabNavigator()

function MyTabBar({ state, navigation }: BottomTabBarProps) {
  const { currentAccount } = useAccountStorage()
  const { hasNewTransactions, resetNewTransactions } = useEnrichedTransactions()
  const { triggerImpact } = useHaptic()
  const { lastViewedTimestamp } = useNotificationStorage()
  const { data: v1Notifications } = useNotificationsQuery({
    variables: {
      address: currentAccount?.address || '',
      resource: currentAccount?.address || '',
    },
    skip: !currentAccount?.address,
    fetchPolicy: 'cache-and-network',
  })

  const { currentData: v2Notifications } = useGetNotificationsQuery(
    currentAccount?.solanaAddress,
    {
      refetchOnMountOrArgChange: true,
    },
  )

  const notifications = useMemo(() => {
    const all = [
      ...(v2Notifications || []),
      ...(v1Notifications?.notifications || []),
    ]

    return all
      .sort(
        ({ time: timeA }, { time: timeB }) =>
          parseISO(timeB).getTime() - parseISO(timeA).getTime(),
      )
      .filter((item) => {
        const viewed =
          (lastViewedTimestamp &&
            isBefore(new Date(item.time), new Date(lastViewedTimestamp))) ||
          !!item.viewedAt
        return !viewed
      })
  }, [v1Notifications, v2Notifications, lastViewedTimestamp])

  const tabData = useMemo((): Array<{
    value: string
    Icon: FC<SvgProps>
    iconColor: Color
    hasBadge?: boolean
  }> => {
    return [
      { value: 'account', Icon: Dollar, iconColor: 'white' },
      {
        value: 'collectables',
        Icon: Gem,
        iconColor: 'white',
        hasBadge: false,
      },
      {
        value: 'activity',
        Icon: Transactions,
        iconColor: 'white',
        hasBadge: hasNewTransactions && state.index !== 2,
      },
      {
        value: 'notifications',
        Icon: Notifications,
        iconColor: 'white',
        hasBadge: notifications.length > 0 && state.index !== 4,
      },
      { value: 'browser', Icon: Globe, iconColor: 'white' },
    ]
  }, [hasNewTransactions, state.index, notifications])

  const selectedValue = tabData[state.index].value
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

  const onPress = useCallback(
    (type: string) => {
      triggerImpact('light')
      const index = tabData.findIndex((item) => item.value === type)
      const isSelected = selectedValue === type
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[index || 0].key,
        canPreventDefault: true,
      })

      // Check if activty tab is selected and has new transactions
      if (selectedValue === 'activity' && hasNewTransactions) {
        resetNewTransactions()
      }

      if (!isSelected && !event.defaultPrevented) {
        // The `merge: true` option makes sure that the params inside the tab screen are preserved
        navigation.navigate({
          name: state.routes[index || 0].name,
          merge: true,
          params: undefined,
        })
      }
    },
    [
      hasNewTransactions,
      navigation,
      resetNewTransactions,
      selectedValue,
      state.routes,
      tabData,
      triggerImpact,
    ],
  )

  const onLongPress = useCallback(
    (type: string) => {
      const index = tabData.findIndex((item) => item.value === type)

      navigation.emit({
        type: 'tabLongPress',
        target: state.routes[index || 0].key,
      })
    },
    [navigation, state.routes, tabData],
  )

  return (
    <Box position="absolute" bottom={0} left={0} right={0}>
      <Box backgroundColor="black900_9A">
        <SafeAreaBox edges={safeEdges}>
          <NavBar
            navBarOptions={tabData}
            selectedValue={selectedValue}
            onItemSelected={onPress}
            onItemLongPress={onLongPress}
          />
        </SafeAreaBox>
      </Box>
    </Box>
  )
}

const TabBarNavigator = () => {
  const dispatch = useDispatch()
  const { data: status } = useGetSolanaStatusQuery()

  const {
    doneSolanaMigration,
    l1Network,
    solanaNetwork: cluster,
    updateSolanaNetwork,
  } = useAppStorage()
  const { bottom } = useSafeAreaInsets()
  const { currentAccount, anchorProvider } = useAccountStorage()

  useEffect(() => {
    dispatch(appSlice.actions.setShowBanner(true))
  }, [dispatch])

  // Switch to mainnet-beta if migration is complete & user hasn't already migrated
  useEffect(() => {
    if (!currentAccount?.solanaAddress) {
      return
    }

    if (
      status?.migrationStatus === 'complete' &&
      !doneSolanaMigration[cluster].includes(currentAccount.solanaAddress)
    ) {
      updateSolanaNetwork('mainnet-beta')
    }
  }, [
    currentAccount,
    doneSolanaMigration,
    updateSolanaNetwork,
    status,
    cluster,
  ])

  return (
    <>
      {currentAccount?.solanaAddress &&
        anchorProvider &&
        !doneSolanaMigration[cluster].includes(
          currentAccount.solanaAddress,
        ) && (
          <Portal>
            <SolanaMigration
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
            />
          </Portal>
        )}
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <MyTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
        sceneContainerStyle={{
          paddingBottom:
            l1Network === 'solana' ? NavBarHeight + bottom : undefined,
        }}
      >
        <Tab.Screen name="Home" component={HomeNavigator} />
        <Tab.Screen name="Collectables" component={CollectablesTabNavigator} />
        <Tab.Screen name="Activity" component={ActivityNavigator} />
        <Tab.Screen
          name="NotificationsNavigator"
          component={NotificationsNavigator}
        />
        <Tab.Screen name="Browser" component={BrowserNavigator} />
      </Tab.Navigator>
    </>
  )
}

export default TabBarNavigator
