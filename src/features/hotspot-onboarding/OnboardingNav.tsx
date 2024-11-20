import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import * as React from 'react'
import { useColors } from '@theme/themeHooks'
import SelectDevice from './SelectDevice'

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
    </Stack.Navigator>
  )
})
