import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import { JupiterProvider } from '@storage/JupiterProvider'
import React, { memo } from 'react'
import SwappingScreen from './SwappingScreen'
import SwapScreen from './SwapScreen'

const SwapStack = createNativeStackNavigator()

const cardPresentation: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'card',
}

const SwapStackScreen = () => {
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
