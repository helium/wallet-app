import React, { FC, useCallback, useMemo } from 'react'
import { SvgProps } from 'react-native-svg'
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import { Edge } from 'react-native-safe-area-context'
import useHotspots from '../utils/useHotspots'
import NavBar from '../components/NavBar'
import Dollar from '../assets/images/dollar.svg'
import Gem from '../assets/images/gem.svg'
import Swaps from '../assets/images/swaps.svg'
import Transactions from '../assets/images/transactions.svg'
import Notifications from '../assets/images/notifications.svg'
import { Color } from '../theme/theme'
import HomeNavigator from '../features/home/HomeNavigator'
import CollectableNavigator from '../features/collectables/CollectablesNavigator'
import ActivityNavigator from '../features/activity/ActivityNavigator'
import NotificationsNavigator from '../features/notifications/NotificationsNavigator'
import SafeAreaBox from '../components/SafeAreaBox'
import Box from '../components/Box'

const Tab = createBottomTabNavigator()

function MyTabBar({ state, navigation }: BottomTabBarProps) {
  const { allPendingRewards } = useHotspots()

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
        hasBadge: allPendingRewards > 0,
      },
      { value: 'swaps', Icon: Swaps, iconColor: 'white' },
      { value: 'activity', Icon: Transactions, iconColor: 'white' },
      { value: 'notifications', Icon: Notifications, iconColor: 'white' },
    ]
  }, [allPendingRewards])

  const selectedValue = tabData[state.index].value
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

  const onPress = useCallback(
    (type: string) => {
      const index = tabData.findIndex((item) => item.value === type)
      const isSelected = selectedValue === type
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[index || 0].key,
        canPreventDefault: true,
      })

      if (!isSelected && !event.defaultPrevented) {
        // The `merge: true` option makes sure that the params inside the tab screen are preserved
        navigation.navigate({
          name: state.routes[index || 0].name,
          merge: true,
          params: undefined,
        })
      }
    },
    [navigation, selectedValue, state.routes, tabData],
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
    <Box backgroundColor="black900">
      <SafeAreaBox edges={safeEdges}>
        <NavBar
          backgroundColor="black900"
          navBarOptions={tabData}
          selectedValue={selectedValue}
          onItemSelected={onPress}
          onItemLongPress={onLongPress}
        />
      </SafeAreaBox>
    </Box>
  )
}

const TabBarNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props: BottomTabBarProps) => <MyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Collectables" component={CollectableNavigator} />
      <Tab.Screen name="Swaps" component={CollectableNavigator} />
      <Tab.Screen name="Activity" component={ActivityNavigator} />
      <Tab.Screen
        name="NotificationsNavigator"
        component={NotificationsNavigator}
      />
    </Tab.Navigator>
  )
}

export default TabBarNavigator