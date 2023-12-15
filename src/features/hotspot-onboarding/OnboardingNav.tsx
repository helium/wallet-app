import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import * as React from 'react'
import HotspotBLENav from './iot-ble/HotspotBLENav'
import SelectDevice from './SelectDevice'

const Stack = createNativeStackNavigator()

const screenOptions = { headerShown: false } as NativeStackNavigationOptions

export default React.memo(function OnboardingNav() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SelectDevice"
        component={SelectDevice}
        options={screenOptions}
      />
      <Stack.Screen
        name="IotBle"
        component={HotspotBLENav}
        options={screenOptions}
      />
    </Stack.Navigator>
  )
})
