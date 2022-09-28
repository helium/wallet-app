import React, { memo } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import AddNewAccountScreen from './AddNewAccountScreen'
import LedgerNavigator from '../../ledger/LedgerNavigator'
import ImportAccountNavigator from '../../onboarding/import/ImportAccountNavigator'
import CreateAccountNavigator from '../../onboarding/create/CreateAccountNavigator'
import CLIAccountNavigator from '../../onboarding/cli-import/CLIAccountNavigator'

const AddAccountStack = createStackNavigator()

const navigatorScreenOptions = {
  presentation: 'transparentModal',
  headerShown: false,
} as StackNavigationOptions

const AddNewAccountNavigator = () => {
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
        // options={cardPresentation}
      />
      <AddAccountStack.Screen
        name="CLIAccountNavigator"
        component={CLIAccountNavigator}
      />
    </AddAccountStack.Navigator>
  )
}
export default memo(AddNewAccountNavigator)
