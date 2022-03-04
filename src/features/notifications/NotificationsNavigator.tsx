import React, { memo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useOpacity } from '../../theme/themeHooks'
import NotificationsScreen from './NotificationsScreen'

const NotificationsStack = createNativeStackNavigator()

const NotificationsNavigator = () => {
  const { backgroundStyle } = useOpacity('primaryBackground', 0.98)
  return (
    <NotificationsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: backgroundStyle,
      }}
    >
      <NotificationsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
    </NotificationsStack.Navigator>
  )
}

export default memo(NotificationsNavigator)
