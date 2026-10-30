import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Platform } from 'react-native'
import DeviceScan from './DeviceScan'
import DeviceShow from './DeviceShow'
import PairSuccess from './PairSuccess'
import DeviceChooseType from './DeviceChooseType'
import DeviceScanUsb from './DeviceScanUsb'

const LedgerStack = createNativeStackNavigator()

const LedgerNavigator = () => {
  return (
    <LedgerStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {Platform.OS === 'android' && (
        <LedgerStack.Screen
          name="DeviceChooseType"
          component={DeviceChooseType}
        />
      )}
      <LedgerStack.Screen name="DeviceScan" component={DeviceScan} />
      <LedgerStack.Screen name="DeviceScanUsb" component={DeviceScanUsb} />
      <LedgerStack.Screen name="DeviceShow" component={DeviceShow} />
      <LedgerStack.Screen name="PairSuccess" component={PairSuccess} />
    </LedgerStack.Navigator>
  )
}

export default LedgerNavigator
