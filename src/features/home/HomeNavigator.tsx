import React, { memo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AccountAssignScreen from '../onboarding/AccountAssignScreen'
import AccountsScreen from '../account/AccountsScreen'
import PaymentScreen from '../payment/PaymentScreen'
import WifiPurchase from '../payment/WifiPurchase'
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
