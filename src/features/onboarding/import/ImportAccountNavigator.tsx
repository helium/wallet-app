import * as React from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { memo } from 'react'
import { ImportAccountStackParamList } from './importAccountNavTypes'
import AccountImportStartScreen from './AccountImportStartScreen'
import AccountImportScreen from './AccountImportScreen'
import ImportAccountConfirmScreen from './ImportAccountConfirmScreen'
import AccountImportCompleteScreen from './AccountImportCompleteScreen'
import AccountAssignScreen from '../AccountAssignScreen'
import AccountCreatePinScreen from '../AccountCreatePinScreen'
import AccountConfirmPinScreen from '../AccountConfirmPinScreen'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'

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
  return (
    <ImportAccountStack.Navigator screenOptions={screenOptions}>
      {sortedAccounts.length === 0 && (
        <ImportAccountStack.Screen
          name="AccountImportStartScreen"
          component={AccountImportStartScreen}
        />
      )}
      <ImportAccountStack.Screen
        name="AccountImportScreen"
        component={AccountImportScreen}
      />
      <ImportAccountStack.Screen
        name="ImportAccountConfirmScreen"
        component={ImportAccountConfirmScreen}
      />
      <ImportAccountStack.Screen
        name="AccountImportCompleteScreen"
        component={AccountImportCompleteScreen}
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
    </ImportAccountStack.Navigator>
  )
}

export default memo(ImportAccountNavigator)
