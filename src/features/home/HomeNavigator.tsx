import React, { memo } from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
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
import VoteNavigator from '../vote/VoteNavigator'
import DappLoginScreen from '../dappLogin/DappLoginScreen'
import AccountTokenScreen from '../account/AccountTokenScreen'
import AddNewAccountNavigator from './addNewAccount/AddNewAccountNavigator'
import ImportAccountNavigator from '../onboarding/import/ImportAccountNavigator'
import BurnScreen from '../burn/BurnScreen'
import ImportPrivateKey from '../onboarding/import/ImportPrivateKey'
import AccountManageTokenListScreen from '../account/manageToken/AccountManageTokenListScreen'
import AccountManageTokenAddScreen from '../account/manageToken/AccountManageTokenAddScreen'
import AccountManageTokenCompleteScreen from '../account/manageToken/AccountManageTokenCompleteScreen'

const HomeStack = createNativeStackNavigator()

const screenOptions = {
  presentation: 'modal',
} as NativeStackNavigationOptions

const navigatorScreenOptions = {
  animationTypeForReplace: 'push',
  presentation: 'modal',
  headerShown: false,
} as NativeStackNavigationOptions

const cardPresentation = {
  presentation: 'card',
} as NativeStackNavigationOptions

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={navigatorScreenOptions}>
      <HomeStack.Screen name="AccountsScreen" component={AccountsScreen} />
      <HomeStack.Screen
        name="AccountTokenScreen"
        component={AccountTokenScreen}
        options={cardPresentation}
      />
      <HomeStack.Screen
        name="AccountManageTokenListScreen"
        component={AccountManageTokenListScreen}
      />
      <HomeStack.Screen
        name="AccountManageTokenAddScreen"
        component={AccountManageTokenAddScreen}
      />
      <HomeStack.Screen
        name="AccountManageTokenCompleteScreen"
        component={AccountManageTokenCompleteScreen}
      />
      <HomeStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <HomeStack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <HomeStack.Screen name="PaymentScreen" component={PaymentScreen} />
      <HomeStack.Screen name="BurnScreen" component={BurnScreen} />
      <HomeStack.Screen name="PaymentQrScanner" component={PaymentQrScanner} />
      <HomeStack.Screen name="RequestScreen" component={RequestScreen} />
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
        name="AddNewAccountNavigator"
        component={AddNewAccountNavigator}
        options={screenOptions}
      />

      <HomeStack.Screen name="VoteNavigator" component={VoteNavigator} />

      <HomeStack.Screen
        name="ReImportAccountNavigator"
        component={ImportAccountNavigator}
      />

      <HomeStack.Screen name="ImportPrivateKey" component={ImportPrivateKey} />
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
