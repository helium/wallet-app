import React, { memo } from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import { useAppStorage } from '@storage/AppStorageProvider'
import BrowserScreen from './BrowserScreen'
import { BrowserWrapper } from './BrowserWebViewScreen'
import DAppTutorial from './DAppTutorial'
import { useSolana } from '../../solana/SolanaProvider'

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
  const { dAppTutorialShown } = useAppStorage()
  const { cluster } = useSolana()

  return (
    <BrowserStack.Navigator
      screenOptions={cardPresentation}
      initialRouteName="DAppTutorial"
    >
      {!dAppTutorialShown[cluster] && (
        <BrowserStack.Screen name="DAppTutorial" component={DAppTutorial} />
      )}
      <BrowserStack.Screen name="BrowserScreen" component={BrowserScreen} />
      <BrowserStack.Screen
        name="BrowserWebViewScreen"
        component={BrowserWrapper}
        options={modalPresentation}
      />
    </BrowserStack.Navigator>
  )
}
export default memo(BrowserStackScreen)
