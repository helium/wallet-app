import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import ScanQrCode from './ScanQrCodeScreen'
import SelectKeystoneAccountsScreen from './SelectKeystoneAccountsScreen'
import KeystoneAccountAssignScreen from './KeystoneAccountAssignScreen'

const KeystoneStack = createStackNavigator()

const KeystoneNavigator = () => {
  return (
    <KeystoneStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <KeystoneStack.Screen name="ScanQrCode" component={ScanQrCode} />
      <KeystoneStack.Screen
        name="SelectKeystoneAccounts"
        component={SelectKeystoneAccountsScreen}
      />
      <KeystoneStack.Screen
        name="KeystoneAccountAssignScreen"
        component={KeystoneAccountAssignScreen}
      />
    </KeystoneStack.Navigator>
  )
}

export default KeystoneNavigator
