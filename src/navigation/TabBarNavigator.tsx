import React, { FC, useCallback, useMemo } from 'react'
import { SvgProps } from 'react-native-svg'
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import { Edge } from 'react-native-safe-area-context'
import NavBar from '../components/NavBar'
import Dollar from '../assets/images/dollar.svg'
import Gem from '../assets/images/gem.svg'
import Swaps from '../assets/images/swaps.svg'
import Transactions from '../assets/images/transactions.svg'
import Notifications from '../assets/images/notifications.svg'
import { Color } from '../theme/theme'
import HomeNavigator from '../features/home/HomeNavigator'
import CollectableNavigator from '../features/collectables/CollectablesNavigator'
import SafeAreaBox from '../components/SafeAreaBox'
import Box from '../components/Box'

const Tab = createBottomTabNavigator()

function MyTabBar({ state, navigation }: BottomTabBarProps) {
  const tabData = useMemo((): Array<{
    value: string
    Icon: FC<SvgProps>
    iconColor: Color
  }> => {
    return [
      { value: 'account', Icon: Dollar, iconColor: 'white' },
      { value: 'collectables', Icon: Gem, iconColor: 'white' },
      { value: 'swaps', Icon: Swaps, iconColor: 'white' },
      { value: 'transactions', Icon: Transactions, iconColor: 'white' },
      { value: 'notifications', Icon: Notifications, iconColor: 'white' },
    ]
  }, [])

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
      <Tab.Screen name="Transactions" component={CollectableNavigator} />
      <Tab.Screen name="Notifications" component={CollectableNavigator} />
    </Tab.Navigator>
  )
}

export default TabBarNavigator
