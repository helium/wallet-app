import React, { useMemo } from 'react'
import {
  StackNavigationOptions,
  StackNavigationProp,
  createStackNavigator,
} from '@react-navigation/stack'
import { useColors } from '@theme/themeHooks'
import AddNewAccountNavigator from '@features/home/addNewAccount/AddNewAccountNavigator'
import AccountAssignScreen from '@features/onboarding/AccountAssignScreen'
import { RouteAccount } from '@features/onboarding/create/createAccountNavTypes'
import ImportAccountNavigator from '@features/onboarding/import/ImportAccountNavigator'
import YourWalletsPage from './pages/YourWalletsPage'

export type AccountsServiceStackParamList = {
  YourWalletsPage: undefined
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
}

export type AccountsServiceNavigationProp =
  StackNavigationProp<AccountsServiceStackParamList>

const AccountsServiceStack =
  createStackNavigator<AccountsServiceStackParamList>()

const AccountsService = () => {
  const colors = useColors()
  const screenOptions: StackNavigationOptions = useMemo(
    () => ({
      headerShown: false,
      animationEnabled: false,
      cardStyle: { backgroundColor: colors.primaryBackground },
    }),
    [],
  )
  return (
    <AccountsServiceStack.Navigator screenOptions={screenOptions}>
      <AccountsServiceStack.Screen
        name="YourWalletsPage"
        component={YourWalletsPage}
      />
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
    </AccountsServiceStack.Navigator>
  )
}

export default AccountsService
