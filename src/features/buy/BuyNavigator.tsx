import React, { memo } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import BuyTokenScreen from './BuyTokenScreen'
import BuyAmountScreen from './BuyAmountScreen'
import BuyProviderScreen from './BuyProviderScreen'

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
        name="BuyProviderScreen"
        options={cardPresentation}
        component={BuyProviderScreen}
      />
    </BuyStack.Navigator>
  )
}
export default memo(BuyStackScreen)
