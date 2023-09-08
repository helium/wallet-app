import { HotspotBleProvider } from '@helium/react-native-sdk'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import * as React from 'react'
import AddGatewayBle from './AddGatewayBle'
import Diagnostics from './Diagnostics'
import ScanHotspots from './ScanHotspots'
import WifiSettings from './WifiSettings'
import WifiSetup from './WifiSetup'

const Stack = createNativeStackNavigator()

const screenOptions = { headerShown: false } as NativeStackNavigationOptions

export default React.memo(function HotspotBLENav() {
  return (
    <HotspotBleProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="ScanHotspots"
          component={ScanHotspots}
          options={screenOptions}
        />
        <Stack.Screen
          name="WifiSettings"
          component={WifiSettings}
          options={screenOptions}
        />
        <Stack.Screen
          name="WifiSetup"
          component={WifiSetup}
          options={screenOptions}
        />
        <Stack.Screen
          name="AddGatewayBle"
          component={AddGatewayBle}
          options={screenOptions}
        />
        <Stack.Screen
          name="Diagnostics"
          component={Diagnostics}
          options={screenOptions}
        />
      </Stack.Navigator>
    </HotspotBleProvider>
  )
})
