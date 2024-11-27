import * as React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useColors } from '@config/theme/themeHooks'
import CLIAccountImportStartScreen from './CLIAccountImportStartScreen'
import CLIPasswordScreen from './CLIPasswordScreen'
import CLIQrScanner from './CLIQrScanner'
import AccountAssignScreen from '../AccountAssignScreen'

const CLIAccountStack = createStackNavigator()

const CLIAccountNavigator = () => {
  const colors = useColors()

  return (
    <>
      <CLIAccountStack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: colors.primaryBackground,
          },
        }}
      >
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
