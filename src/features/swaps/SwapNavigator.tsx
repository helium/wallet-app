import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import { JupiterProvider } from '@storage/JupiterProvider'
import React, { memo, useMemo } from 'react'
import SwappingScreen from './SwappingScreen'
import SwapScreen from './SwapScreen'

const SwapStack = createNativeStackNavigator()

const SwapStackScreen = () => {
  const cardPresentation: NativeStackNavigationOptions = useMemo(
    () => ({
      headerShown: false,
      presentation: 'card',
    }),
    [],
  )

  return (
    <JupiterProvider>
      <SwapStack.Navigator screenOptions={cardPresentation}>
        <SwapStack.Screen name="SwapScreen" component={SwapScreen} />
        <SwapStack.Screen name="SwappingScreen" component={SwappingScreen} />
      </SwapStack.Navigator>
    </JupiterProvider>
  )
}
export default memo(SwapStackScreen)
