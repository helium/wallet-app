import React, { memo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useOpacity } from '../../theme/themeHooks'
import NotificationsList from './NotificationsList'
import NotificationDetails from './NotificationDetails'

const NotificationsListStack = createNativeStackNavigator()

const NotificationsListNavigator = () => {
  const { backgroundStyle } = useOpacity('primaryBackground', 0.98)
  return (
    <NotificationsListStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: backgroundStyle,
      }}
    >
      <NotificationsListStack.Screen
        name="NotificationsList"
        component={NotificationsList}
      />
      <NotificationsListStack.Screen
        name="NotificationDetails"
        component={NotificationDetails}
      />
    </NotificationsListStack.Navigator>
  )
}

export default memo(NotificationsListNavigator)
