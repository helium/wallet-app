import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { Platform } from 'react-native'
import ScanQrCode from './ScanQrCodeScreen'
import SelectKeystoneAccountsScreen from './SelectKeystoneAccountsScreen'
import KeystoneAccountAssignScreen from './KeystoneAccountAssignScreen'
// import SelectAccountsScreen from './SelectAccountsScreen'
// import ImportSubAccountsScreen from '../onboarding/import/ImportSubAccountsScreen'

const KeystoneStack = createStackNavigator()

const KeystoneNavigator = () => {
  return (
    <KeystoneStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* {Platform.OS === 'android' && ( */}
      <KeystoneStack.Screen name="ScanQrCode" component={ScanQrCode} />
      {/* )} */}
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
