import React, { memo } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import BuyTokenScreen from './BuyTokenScreen'
import BuyAmountScreen from './BuyAmountScreen'
import ChooseProviderScreen from './ChooseProviderScreen'
import CoinbaseWebView from './CoinbaseWebView'

const BuyStack = createStackNavigator()

const modalPresentation: StackNavigationOptions = {
  headerShown: false,
  presentation: 'modal',
}

const cardPresentation: StackNavigationOptions = {
  presentation: 'card',
}

const BuyStackScreen = () => {
  return (
    <BuyStack.Navigator screenOptions={modalPresentation}>
      <BuyStack.Screen
        name="BuyTokenScreen"
        options={cardPresentation}
        component={BuyTokenScreen}
      />
      <BuyStack.Screen
        name="BuyAmountScreen"
        options={cardPresentation}
        component={BuyAmountScreen}
      />
      <BuyStack.Screen
        name="ChooseProviderScreen"
        options={cardPresentation}
        component={ChooseProviderScreen}
      />
      <BuyStack.Screen
        name="CoinbaseWebView"
        options={cardPresentation}
        component={CoinbaseWebView}
      />
    </BuyStack.Navigator>
  )
}
export default memo(BuyStackScreen)
