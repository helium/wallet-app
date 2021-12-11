import React, { memo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AccountAssignScreen from '../onboarding/AccountAssignScreen'
import AccountsScreen from '../account/AccountsScreen'
import PaymentScreen from '../payment/PaymentScreen'
import WifiOnboard from '../payment/WifiOnboard'
import AddressBookNavigator from '../addressBook/AddressBookNavigator'

const HomeStack = createNativeStackNavigator()

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
      }}
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
      <HomeStack.Screen name="PaymentScreen" component={PaymentScreen} />
      <HomeStack.Screen name="WifiOnboard" component={WifiOnboard} />
      <HomeStack.Screen
        name="AddressBookNavigator"
        component={AddressBookNavigator}
        options={{ presentation: 'transparentModal' }}
      />
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
