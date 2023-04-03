import React, { memo } from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import { useAppStorage } from '@storage/AppStorageProvider'
import BrowserScreen from './BrowserScreen'
import BrowserWebViewScreen from './BrowserWebViewScreen'
import DefiTutorial from './DefiTutorial'

const BrowserStack = createNativeStackNavigator()

const cardPresentation: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'card',
}

const modalPresentation: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'transparentModal',
  animation: 'slide_from_bottom',
}

const BrowserStackScreen = () => {
  const { defiTutorialShown } = useAppStorage()

  return (
    <BrowserStack.Navigator screenOptions={cardPresentation}>
      {!defiTutorialShown && (
        <BrowserStack.Screen name="DefiTutorial" component={DefiTutorial} />
      )}
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
