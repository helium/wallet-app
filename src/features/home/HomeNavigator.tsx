import React, { memo } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import Home from './Home'
import MultiAccountNavigator from '../onboarding/MultiAccountNavigator'

const HomeStack = createStackNavigator()

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={{ presentation: 'modal' }}>
      <HomeStack.Screen
        name="Home"
        options={{ headerShown: false }}
        component={Home}
      />

      <HomeStack.Screen
        name="AddAccount"
        options={{ headerShown: false }}
        component={MultiAccountNavigator}
      />
    </HomeStack.Navigator>
  )
}

export default memo(HomeStackScreen)
