import React, { memo } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import AccountAssignScreen from '../onboarding/AccountAssignScreen'
import AccountsScreen from '../account/AccountsScreen'
import PaymentScreen from '../payment/PaymentScreen'
import WifiPurchase from '../payment/WifiPurchase'
import AddressBookNavigator from '../addressBook/AddressBookNavigator'

const HomeStack = createStackNavigator()

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="AccountsScreen" component={AccountsScreen} />
      <HomeStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <HomeStack.Screen name="PaymentScreen" component={PaymentScreen} />
      <HomeStack.Screen name="WifiPurchase" component={WifiPurchase} />
      <HomeStack.Screen
        name="AddressBookNavigator"
        component={AddressBookNavigator}
        options={{ presentation: 'transparentModal' }}
      />
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
