import React, { memo } from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import BrowserScreen from './BrowserScreen'

const BrowserStack = createNativeStackNavigator()

const cardPresentation: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'card',
}

const BrowserStackScreen = () => {
  return (
    <BrowserStack.Navigator screenOptions={cardPresentation}>
      <BrowserStack.Screen name="SwapScreen" component={BrowserScreen} />
    </BrowserStack.Navigator>
  )
}
export default memo(BrowserStackScreen)
