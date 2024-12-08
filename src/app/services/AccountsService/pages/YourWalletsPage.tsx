import React, { useMemo } from 'react'
import {
  StackNavigationOptions,
  StackNavigationProp,
  createStackNavigator,
} from '@react-navigation/stack'
import { useColors } from '@config/theme/themeHooks'
import AddNewAccountNavigator from '@features/home/addNewAccount/AddNewAccountNavigator'
import AccountAssignScreen from '@features/onboarding/AccountAssignScreen'
import { RouteAccount } from '@features/onboarding/create/createAccountNavTypes'
import ImportAccountNavigator from '@features/onboarding/import/ImportAccountNavigator'
import KeystoneNavigator from '@features/keystone/KeystoneNavigator'
import WalletList from '@features/accounts/WalletList'

export type AccountsServiceStackParamList = {
  WalletList: undefined
  AddNewAccountNavigator: undefined
  AccountAssignScreen: undefined | RouteAccount
  ReImportAccountNavigator:
    | undefined
    | {
        screen: 'AccountImportScreen'
        params: {
          restoringAccount?: boolean
          accountAddress?: string
        }
      }
  KeystoneNavigator: {
    screen: 'KeystoneNavigator'
    params: {
      screen: string
    }
  }
}

export type AccountsServiceNavigationProp =
  StackNavigationProp<AccountsServiceStackParamList>

const AccountsServiceStack =
  createStackNavigator<AccountsServiceStackParamList>()

const YourWalletsPage = () => {
  const colors = useColors()
  const screenOptions: StackNavigationOptions = useMemo(
    () => ({
      headerShown: false,
      animationEnabled: false,
      cardStyle: { backgroundColor: colors.primaryBackground },
    }),
    [colors],
  )
  return (
    <AccountsServiceStack.Navigator screenOptions={screenOptions}>
      <AccountsServiceStack.Screen name="WalletList" component={WalletList} />
      <AccountsServiceStack.Screen
        name="AddNewAccountNavigator"
        component={AddNewAccountNavigator}
      />
      <AccountsServiceStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <AccountsServiceStack.Screen
        name="ReImportAccountNavigator"
        component={ImportAccountNavigator}
      />
      <AccountsServiceStack.Screen
        name="KeystoneNavigator"
        component={KeystoneNavigator}
      />
    </AccountsServiceStack.Navigator>
  )
}

export default YourWalletsPage
