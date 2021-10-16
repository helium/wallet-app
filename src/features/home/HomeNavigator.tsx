import React, { memo } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import AccountAssignScreen from '../onboarding/AccountAssignScreen'
import AccountsScreen from '../account/AccountsScreen'

const HomeStack = createStackNavigator()

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{ presentation: 'modal', headerShown: false }}
    >
      <HomeStack.Screen
        name="AccountsScreen"
        options={{ headerShown: false }}
        component={AccountsScreen}
      />
      <HomeStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
    </HomeStack.Navigator>
  )
}

export default memo(HomeStackScreen)
