import React, { memo } from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import ActivityScreen from './ActivityScreen'
import ActivityDetailsScreen from './ActivityDetailsScreen'

const ActivityStack = createNativeStackNavigator()

const modalPresentation: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'modal',
}

const cardPresentation: NativeStackNavigationOptions = {
  presentation: 'card',
}

const ActivityStackScreen = () => {
  return (
    <ActivityStack.Navigator screenOptions={modalPresentation}>
      <ActivityStack.Screen name="ActivityScreen" component={ActivityScreen} />
      <ActivityStack.Screen
        name="ActivityDetailsScreen"
        component={ActivityDetailsScreen}
        options={cardPresentation}
      />
    </ActivityStack.Navigator>
  )
}
export default memo(ActivityStackScreen)
