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
import PaymentQrScanner from '../payment/PaymentQrScanner'
import ConfirmPinScreen from '../../components/ConfirmPinScreen'
import AddressQrScanner from '../addressBook/AddressQrScanner'
import CreateAccountNavigator from '../onboarding/create/CreateAccountNavigator'
import ImportAccountNavigator from '../onboarding/import/ImportAccountNavigator'
import LedgerNavigator from '../ledger/LedgerNavigator'

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
      <HomeStack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <HomeStack.Screen name="PaymentScreen" component={PaymentScreen} />
      <HomeStack.Screen name="PaymentQrScanner" component={PaymentQrScanner} />
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
      <HomeStack.Screen name="ScanAddress" component={AddressQrScanner} />

      <HomeStack.Screen
        name="CreateAccount"
        component={CreateAccountNavigator}
      />
      <HomeStack.Screen
        name="ImportAccount"
        component={ImportAccountNavigator}
      />
      <HomeStack.Screen name="LedgerNavigator" component={LedgerNavigator} />
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
