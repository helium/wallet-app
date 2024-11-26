import React, { memo, useMemo } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { useColors } from '@config/theme/themeHooks'
import KeystoneNavigator from '../../keystone/KeystoneNavigator'
import AddNewAccountScreen from './AddNewAccountScreen'
import LedgerNavigator from '../../ledger/LedgerNavigator'
import ImportAccountNavigator from '../../onboarding/import/ImportAccountNavigator'
import CreateAccountNavigator from '../../onboarding/create/CreateAccountNavigator'
import CLIAccountNavigator from '../../onboarding/cli-import/CLIAccountNavigator'

const AddAccountStack = createStackNavigator()

const AddNewAccountNavigator = () => {
  const colors = useColors()
  const navigatorScreenOptions = useMemo(
    () =>
      ({
        presentation: 'transparentModal',
        headerShown: false,
        cardStyle: { backgroundColor: colors.primaryBackground },
      } as StackNavigationOptions),
    [colors],
  )

  return (
    <AddAccountStack.Navigator screenOptions={navigatorScreenOptions}>
      <AddAccountStack.Screen
        name="AddNewAccount"
        component={AddNewAccountScreen}
      />

      <AddAccountStack.Screen
        name="CreateAccount"
        component={CreateAccountNavigator}
      />
      <AddAccountStack.Screen
        name="ImportAccount"
        component={ImportAccountNavigator}
      />
      <AddAccountStack.Screen
        name="LedgerNavigator"
        component={LedgerNavigator}
      />
      <AddAccountStack.Screen
        name="CLIAccountNavigator"
        component={CLIAccountNavigator}
      />
      <AddAccountStack.Screen
        name="KeystoneNavigator"
        component={KeystoneNavigator}
      />
    </AddAccountStack.Navigator>
  )
}
export default memo(AddNewAccountNavigator)
