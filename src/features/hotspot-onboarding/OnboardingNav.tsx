import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import * as React from 'react'
import HotspotBLENav from './iot-ble/HotspotBLENav'
import SelectDevice from './SelectDevice'
import { useColors } from '@theme/themeHooks'

const Stack = createNativeStackNavigator()

export default React.memo(function OnboardingNav() {
  const colors = useColors()

  const screenOptions = React.useMemo(
    () =>
      ({
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.primaryBackground,
        },
      } as NativeStackNavigationOptions),
    [colors],
  )

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
