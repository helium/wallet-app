import React, { memo } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import AccountAssignScreen from '../onboarding/AccountAssignScreen'
import AccountsScreen from '../account/AccountsScreen'
import PaymentScreen from '../payment/PaymentScreen'
import WifiPurchase from '../payment/WifiPurchase'
import AddressBookNavigator from '../addressBook/AddressBookNavigator'
import SettingsNavigator from '../settings/SettingsNavigator'
import AddNewContact from '../addressBook/AddNewContact'
import NotificationsNavigator from '../notifications/NotificationsNavigator'
import RequestScreen from '../request/RequestScreen'
import LinkWallet from '../txnDelegatation/LinkWallet'
import SignHotspot from '../txnDelegatation/SignHotspot'

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
      <HomeStack.Screen name="RequestScreen" component={RequestScreen} />
      <HomeStack.Screen
        name="WifiPurchase"
        component={WifiPurchase}
      />
      <HomeStack.Screen
        name="AddressBookNavigator"
        component={AddressBookNavigator}
        options={{ presentation: 'transparentModal' }}
      />
      <HomeStack.Screen
        name="NotificationsNavigator"
        component={NotificationsNavigator}
        options={{ presentation: 'transparentModal' }}
      />
      <HomeStack.Screen
        name="SettingsNavigator"
        component={SettingsNavigator}
        options={{ presentation: 'transparentModal' }}
      />
      <HomeStack.Screen name="AddNewContact" component={AddNewContact} />
      <HomeStack.Screen
        name="LinkWallet"
        component={LinkWallet}
        options={{ presentation: 'transparentModal' }}
      />
      <HomeStack.Screen
        name="SignHotspot"
        component={SignHotspot}
        options={{ presentation: 'transparentModal' }}
      />
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
