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
import { useDispatch, useSelector } from 'react-redux'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import SolanaMigration from '../features/migration/SolanaMigration'
import HomeNavigator from '../features/home/HomeNavigator'
import CollectablesNavigator from '../features/collectables/CollectablesNavigator'
import ActivityNavigator from '../features/activity/ActivityNavigator'
import NotificationsNavigator from '../features/notifications/NotificationsNavigator'
import BrowserNavigator from '../features/browser/BrowserNavigator'
import { appSlice } from '../store/slices/appSlice'
import { useSolana } from '../solana/SolanaProvider'
import { RootState } from '../store/rootReducer'

const Tab = createBottomTabNavigator()

function MyTabBar({ state, navigation }: BottomTabBarProps) {
  const { hasNewTransactions, resetNewTransactions } = useEnrichedTransactions()
  const { triggerImpact } = useHaptic()

  const notificationsByResource = useSelector(
    (appState: RootState) => appState.notifications.notifications,
  )

  const hasUnreadNotifications = useMemo(() => {
    const allNotifs = Object.keys(notificationsByResource).flatMap(
      (k) => notificationsByResource[k],
    )

    const unread = allNotifs.find((n) => !n.viewedAt)
    return !!unread
  }, [notificationsByResource])

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
        hasBadge: hasUnreadNotifications && state.index !== 3,
      },
      { value: 'browser', Icon: Globe, iconColor: 'white' },
    ]
  }, [hasNewTransactions, state.index, hasUnreadNotifications])

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
      <Box backgroundColor="black">
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

  const { doneSolanaMigration, manualMigration } = useAppStorage()
  const { cluster, updateCluster } = useSolana()
  const { bottom } = useSafeAreaInsets()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()

  useEffect(() => {
    dispatch(appSlice.actions.setShowBanner(cluster === 'devnet'))
  }, [dispatch, cluster])

  // Switch to mainnet-beta if migration is complete & user hasn't already migrated
  useEffect(() => {
    if (!currentAccount?.solanaAddress) {
      return
    }

    if (
      !doneSolanaMigration['mainnet-beta']?.includes(
        currentAccount.solanaAddress,
      ) &&
      !manualMigration['mainnet-beta'].includes(currentAccount.solanaAddress)
    ) {
      updateCluster('mainnet-beta')
    }
  }, [
    currentAccount,
    doneSolanaMigration,
    cluster,
    manualMigration,
    updateCluster,
  ])

  return (
    <>
      {currentAccount?.solanaAddress &&
        anchorProvider &&
        !doneSolanaMigration[cluster]?.includes(currentAccount.solanaAddress) &&
        !manualMigration[cluster]?.includes(currentAccount.solanaAddress) && (
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
          paddingBottom: NavBarHeight + bottom,
        }}
      >
        <Tab.Screen name="Home" component={HomeNavigator} />
        <Tab.Screen name="Collectables" component={CollectablesNavigator} />
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
