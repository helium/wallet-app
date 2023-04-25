import React, { memo } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import ConfirmPinScreen from '@components/ConfirmPinScreen'
import AccountAssignScreen from '../onboarding/AccountAssignScreen'
import AccountsScreen from '../account/AccountsScreen'
import PaymentScreen from '../payment/PaymentScreen'
import AddressBookNavigator from '../addressBook/AddressBookNavigator'
import SettingsNavigator from '../settings/SettingsNavigator'
import AddNewContact from '../addressBook/AddNewContact'
import NotificationsNavigator from '../notifications/NotificationsNavigator'
import RequestScreen from '../request/RequestScreen'
import PaymentQrScanner from '../payment/PaymentQrScanner'
import AddressQrScanner from '../addressBook/AddressQrScanner'
import AccountTokenScreen from '../account/AccountTokenScreen'
import AddNewAccountNavigator from './addNewAccount/AddNewAccountNavigator'
import ImportAccountNavigator from '../onboarding/import/ImportAccountNavigator'
import BurnScreen from '../burn/BurnScreen'
import SwapNavigator from '../swaps/SwapNavigator'
import AirdropScreen from '../account/AirdropScreen'

const HomeStack = createStackNavigator()

const screenModalOptions = {
  presentation: 'modal',
} as StackNavigationOptions

const navigatorScreenOptions = {
  headerShown: false,
} as StackNavigationOptions

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={navigatorScreenOptions}>
      <HomeStack.Screen name="AccountsScreen" component={AccountsScreen} />
      <HomeStack.Screen
        name="AccountTokenScreen"
        component={AccountTokenScreen}
      />
      <HomeStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <HomeStack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <HomeStack.Screen
        name="PaymentScreen"
        component={PaymentScreen}
        options={screenModalOptions}
      />
      <HomeStack.Screen name="BurnScreen" component={BurnScreen} />
      <HomeStack.Screen
        name="PaymentQrScanner"
        component={PaymentQrScanner}
        options={screenModalOptions}
      />
      <HomeStack.Screen
        name="RequestScreen"
        component={RequestScreen}
        options={screenModalOptions}
      />
      <HomeStack.Screen name="AirdropScreen" component={AirdropScreen} />
      <HomeStack.Screen
        name="AddressBookNavigator"
        component={AddressBookNavigator}
        options={screenModalOptions}
      />
      <HomeStack.Screen
        name="NotificationsNavigator"
        component={NotificationsNavigator}
        options={screenModalOptions}
      />
      <HomeStack.Screen
        name="SettingsNavigator"
        component={SettingsNavigator}
        options={screenModalOptions}
      />
      <HomeStack.Screen
        name="SwapNavigator"
        component={SwapNavigator}
        options={screenModalOptions}
      />
      <HomeStack.Screen name="AddNewContact" component={AddNewContact} />
      <HomeStack.Screen name="ScanAddress" component={AddressQrScanner} />

      <HomeStack.Screen
        name="AddNewAccountNavigator"
        component={AddNewAccountNavigator}
        options={screenModalOptions}
      />

      <HomeStack.Screen
        name="ReImportAccountNavigator"
        component={ImportAccountNavigator}
      />
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
