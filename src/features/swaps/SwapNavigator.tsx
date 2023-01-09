import React, { memo } from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import SwapScreen from './SwapScreen'
import SwappingScreen from './SwappingScreen'

const SwapStack = createNativeStackNavigator()

const cardPresentation: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'card',
}

const SwapStackScreen = () => {
  return (
    <SwapStack.Navigator screenOptions={cardPresentation}>
      <SwapStack.Screen name="SwapScreen" component={SwapScreen} />
      <SwapStack.Screen name="SwappingScreen" component={SwappingScreen} />
    </SwapStack.Navigator>
  )
}
export default memo(SwapStackScreen)
