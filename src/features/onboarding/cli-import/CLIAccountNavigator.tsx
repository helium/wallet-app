import * as React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import CLIAccountImportStartScreen from './CLIAccountImportStartScreen'
import CLIPasswordScreen from './CLIPasswordScreen'
import CLIQrScanner from './CLIQrScanner'
import AccountAssignScreen from '../AccountAssignScreen'

const CLIAccountStack = createNativeStackNavigator()

const CLIAccountNavigator = () => {
  return (
    <>
      <CLIAccountStack.Navigator screenOptions={{ headerShown: false }}>
        <CLIAccountStack.Screen
          name="CLIAccountImportStartScreen"
          component={CLIAccountImportStartScreen}
        />
        <CLIAccountStack.Screen name="CLIQrScanner" component={CLIQrScanner} />
        <CLIAccountStack.Screen
          name="CLIPasswordScreen"
          component={CLIPasswordScreen}
        />
        <CLIAccountStack.Screen
          name="AccountAssignScreen"
          component={AccountAssignScreen}
        />
      </CLIAccountStack.Navigator>
    </>
  )
}

export default CLIAccountNavigator
