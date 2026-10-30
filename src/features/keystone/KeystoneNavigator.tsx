import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ScanQrCode from './ScanQrCodeScreen'
import SelectKeystoneAccountsScreen from './SelectKeystoneAccountsScreen'
import KeystoneAccountAssignScreen from './KeystoneAccountAssignScreen'
import { KeystoneStackParamList } from './keystoneNavigatorTypes'

const KeystoneStack = createNativeStackNavigator<KeystoneStackParamList>()

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
