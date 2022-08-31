import React, { memo } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import AccountAssignScreen from '../onboarding/AccountAssignScreen'
import AccountsScreen from '../account/AccountsScreen'
import PaymentScreen from '../payment/PaymentScreen'
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
import VoteNavigator from '../vote/VoteNavigator'
import DappLoginScreen from '../dappLogin/DappLoginScreen'
import InternetNavigator from '../internet/InternetNavigator'
import AccountTokenScreen from '../account/AccountTokenScreen'

const HomeStack = createStackNavigator()

const screenOptions = {
  presentation: 'modal',
} as StackNavigationOptions

const navigatorScreenOptions = {
  presentation: 'modal',
  headerShown: false,
} as StackNavigationOptions

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={navigatorScreenOptions}>
      <HomeStack.Screen name="AccountsScreen" component={AccountsScreen} />
      <HomeStack.Screen
        name="AccountTokenScreen"
        component={AccountTokenScreen}
        options={{ presentation: 'card' }}
      />
      <HomeStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <HomeStack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <HomeStack.Screen name="PaymentScreen" component={PaymentScreen} />
      <HomeStack.Screen name="PaymentQrScanner" component={PaymentQrScanner} />
      <HomeStack.Screen name="RequestScreen" component={RequestScreen} />
      <HomeStack.Screen name="Internet" component={InternetNavigator} />
      <HomeStack.Screen name="DappLoginScreen" component={DappLoginScreen} />
      <HomeStack.Screen
        name="AddressBookNavigator"
        component={AddressBookNavigator}
        options={screenOptions}
      />
      <HomeStack.Screen
        name="NotificationsNavigator"
        component={NotificationsNavigator}
        options={screenOptions}
      />
      <HomeStack.Screen
        name="SettingsNavigator"
        component={SettingsNavigator}
        options={screenOptions}
      />
      <HomeStack.Screen name="AddNewContact" component={AddNewContact} />
      <HomeStack.Screen
        name="LinkWallet"
        component={LinkWallet}
        options={screenOptions}
      />
      <HomeStack.Screen
        name="SignHotspot"
        component={SignHotspot}
        options={screenOptions}
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
      <HomeStack.Screen
        name="LedgerNavigator"
        component={LedgerNavigator}
        options={{ presentation: 'card' }}
      />
      <HomeStack.Screen name="VoteNavigator" component={VoteNavigator} />
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
