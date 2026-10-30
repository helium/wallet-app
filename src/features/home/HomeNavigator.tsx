import ConfirmPinScreen from '@components/ConfirmPinScreen'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import React, { memo } from 'react'
import AccountsScreen from '../account/AccountsScreen'
import AccountTokenScreen from '../account/AccountTokenScreen'
import AirdropScreen from '../account/AirdropScreen'
import AccountManageTokenListScreen from '../account/AccountManageTokenListScreen'
import AddNewContact from '../addressBook/AddNewContact'
import AddressBookNavigator from '../addressBook/AddressBookNavigator'
import AddressQrScanner from '../addressBook/AddressQrScanner'
import BurnScreen from '../burn/BurnScreen'
import NotificationsNavigator from '../notifications/NotificationsNavigator'
import AccountAssignScreen from '../onboarding/AccountAssignScreen'
import ImportAccountNavigator from '../onboarding/import/ImportAccountNavigator'
import PaymentQrScanner from '../payment/PaymentQrScanner'
import PaymentScreen from '../payment/PaymentScreen'
import RequestScreen from '../request/RequestScreen'
import SettingsNavigator from '../settings/SettingsNavigator'
import SwapNavigator from '../swaps/SwapNavigator'
import AddNewAccountNavigator from './addNewAccount/AddNewAccountNavigator'
import ImportSubAccountsScreen from '../onboarding/import/ImportSubAccountsScreen'
import KeystoneAccountAssignScreen from '../keystone/KeystoneAccountAssignScreen'

const HomeStack = createNativeStackNavigator()

// A native iOS modal would cover the root overlays (sign sheet, Ledger,
// Keystone, keyboard portal), so slide a card up instead.
const screenModalOptions = {
  presentation: 'card',
  animation: 'slide_from_bottom',
} as NativeStackNavigationOptions

const navigatorScreenOptions = {
  headerShown: false,
} as NativeStackNavigationOptions

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={navigatorScreenOptions}>
      <HomeStack.Screen name="AccountsScreen" component={AccountsScreen} />
      <HomeStack.Screen
        name="AccountTokenScreen"
        component={AccountTokenScreen}
      />
      <HomeStack.Screen
        name="AccountManageTokenListScreen"
        component={AccountManageTokenListScreen}
      />
      <HomeStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <HomeStack.Screen
        name="KeystoneAccountAssignScreen"
        component={KeystoneAccountAssignScreen}
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
      <HomeStack.Screen
        name="ImportSubAccounts"
        component={ImportSubAccountsScreen}
      />
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
