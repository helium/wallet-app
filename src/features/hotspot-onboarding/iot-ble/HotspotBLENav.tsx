import { HotspotBleProvider } from '@helium/react-native-sdk'
import { RouteProp, useRoute } from '@react-navigation/native'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import * as React from 'react'
import { OnboardingtackParamList } from '../navTypes'
import AddGatewayBle from './AddGatewayBle'
import ScanHotspots from './ScanHotspots'
import Settings from './Settings'
import WifiSettings from './WifiSettings'
import Diagnostics from './Diagnostics'
import WifiSetup from './WifiSetup'
import { IotBleOptionsProvider } from './optionsContext'

const Stack = createNativeStackNavigator()

const screenOptions = { headerShown: false } as NativeStackNavigationOptions

type Route = RouteProp<OnboardingtackParamList, 'IotBle'>
export default React.memo(function HotspotBLENav() {
  const route = useRoute<Route>()
  const iotParams = route.params
  return (
    <IotBleOptionsProvider value={iotParams}>
      <HotspotBleProvider>
        <Stack.Navigator>
          <Stack.Screen
            name="ScanHotspots"
            component={ScanHotspots}
            options={screenOptions}
          />
          <Stack.Screen
            name="Settings"
            component={Settings}
            options={screenOptions}
          />
          <Stack.Screen
            name="WifiSettings"
            component={WifiSettings}
            options={screenOptions}
          />
          <Stack.Screen
            name="Diagnostics"
            component={Diagnostics}
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
        </Stack.Navigator>
      </HotspotBleProvider>
    </IotBleOptionsProvider>
  )
})
