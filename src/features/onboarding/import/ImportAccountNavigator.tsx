import React, { memo, useCallback } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { ImportAccountStackParamList } from './importAccountNavTypes'
import AccountImportStartScreen from './AccountImportStartScreen'
import AccountImportScreen from './AccountImportScreen'
import AccountAssignScreen from '../AccountAssignScreen'
import AccountCreatePinScreen from '../AccountCreatePinScreen'
import AccountConfirmPinScreen from '../AccountConfirmPinScreen'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import CLIAccountNavigator from '../cli-import/CLIAccountNavigator'
import ImportSubAccountsScreen from './ImportSubAccountsScreen'

const ImportAccountStack = createStackNavigator<ImportAccountStackParamList>()
const ImportAccountNavigator = () => {
  const { sortedAccounts } = useAccountStorage()

  const screenOptions = React.useMemo(
    () =>
      ({
        headerShown: false,
      } as StackNavigationOptions),
    [],
  )

  const AccountImportStart = useCallback(() => {
    return <AccountImportStartScreen />
  }, [])

  return (
    <ImportAccountStack.Navigator screenOptions={screenOptions}>
      {sortedAccounts.length === 0 && (
        <ImportAccountStack.Screen
          name="AccountImportStartScreen"
          component={AccountImportStart}
        />
      )}
      <ImportAccountStack.Screen
        name="AccountImportScreen"
        component={AccountImportScreen}
      />
      <ImportAccountStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <ImportAccountStack.Screen
        name="AccountCreatePinScreen"
        component={AccountCreatePinScreen}
      />
      <ImportAccountStack.Screen
        name="AccountConfirmPinScreen"
        component={AccountConfirmPinScreen}
      />
      <ImportAccountStack.Screen
        name="CLIAccountNavigator"
        component={CLIAccountNavigator}
      />
      <ImportAccountStack.Screen
        name="ImportSubAccounts"
        component={ImportSubAccountsScreen}
      />
    </ImportAccountStack.Navigator>
  )
}

export default memo(ImportAccountNavigator)
