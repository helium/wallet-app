import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import SafeAreaBox from '../../components/SafeAreaBox'
import DeviceScan from './DeviceScan'
import DeviceShow from './DeviceShow'
import PairSuccess from './PairSuccess'

const LedgerStack = createStackNavigator()

const LedgerNavigator = () => {
  return (
    <SafeAreaBox flex={1} backgroundColor="primaryBackground">
      <LedgerStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <LedgerStack.Screen name="DeviceScan" component={DeviceScan} />
        <LedgerStack.Screen name="DeviceShow" component={DeviceShow} />
        <LedgerStack.Screen name="PairSuccess" component={PairSuccess} />
      </LedgerStack.Navigator>
    </SafeAreaBox>
  )
}

export default LedgerNavigator
