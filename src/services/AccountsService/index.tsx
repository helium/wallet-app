import React, { useMemo } from 'react'
import { ThemeProvider } from '@shopify/restyle'
import { lightTheme } from '@theme/theme'
import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import YourWalletsPage from './pages/YourWalletsPage'
import { useColors } from '@theme/themeHooks'
import AddNewAccountNavigator from '@features/home/addNewAccount/AddNewAccountNavigator'
import AccountAssignScreen from '@features/onboarding/AccountAssignScreen'
import Box from '@components/Box'
import Text from '@components/Text'

const AccountsServiceStack = createStackNavigator()

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
    </AccountsServiceStack.Navigator>
  )
}

export default AccountsService
