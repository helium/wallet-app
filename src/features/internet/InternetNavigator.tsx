import React, { memo } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import InternetPurchase from './InternetPurchase/InternetPurchase'
import WifiProfileInstructions from './WifiProfileInstructions'

const InternetStack = createStackNavigator()

const navigatorScreenOptions = {
  headerShown: false,
} as StackNavigationOptions

const InternetStackScreen = () => {
  return (
    <InternetStack.Navigator screenOptions={navigatorScreenOptions}>
      <InternetStack.Screen
        name="InternetPurchase"
        component={InternetPurchase}
      />
      <InternetStack.Screen
        name="WifiProfileInstructions"
        component={WifiProfileInstructions}
      />
    </InternetStack.Navigator>
  )
}
export default memo(InternetStackScreen)
