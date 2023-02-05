import React, { memo } from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import BrowserScreen from './BrowserScreen'
import BrowserWebViewScreen from './BrowserWebViewScreen'

const BrowserStack = createNativeStackNavigator()

const cardPresentation: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'card',
}

const modalPresentation: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'transparentModal',
  animation: 'slide_from_right',
}

const BrowserStackScreen = () => {
  return (
    <BrowserStack.Navigator screenOptions={cardPresentation}>
      <BrowserStack.Screen name="BrowserScreen" component={BrowserScreen} />
      <BrowserStack.Screen
        name="BrowserWebViewScreen"
        component={BrowserWebViewScreen}
        options={modalPresentation}
      />
    </BrowserStack.Navigator>
  )
}
export default memo(BrowserStackScreen)
