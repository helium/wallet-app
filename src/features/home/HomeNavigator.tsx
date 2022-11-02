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
import VoteNavigator from '../vote/VoteNavigator'
import DappLoginScreen from '../dappLogin/DappLoginScreen'
import AccountTokenScreen from '../account/AccountTokenScreen'
import AddNewAccountNavigator from './addNewAccount/AddNewAccountNavigator'
import ImportAccountNavigator from '../onboarding/import/ImportAccountNavigator'
import BurnScreen from '../burn/BurnScreen'
import AccountCollectionScreen from '../account/AccountCollectionScreen'
import AccountCollectableScreen from '../account/AccountCollectableScreen'

const HomeStack = createStackNavigator()

const screenOptions = {
  presentation: 'modal',
} as StackNavigationOptions

const navigatorScreenOptions = {
  presentation: 'modal',
  headerShown: false,
} as StackNavigationOptions

const cardPresentation = { presentation: 'card' } as StackNavigationOptions

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
        name="AccountCollectionScreen"
        component={AccountCollectionScreen}
        options={cardPresentation}
      />

      <HomeStack.Screen
        name="AccountCollectableScreen"
        component={AccountCollectableScreen}
        options={cardPresentation}
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
    </HomeStack.Navigator>
  )
}
export default memo(HomeStackScreen)
