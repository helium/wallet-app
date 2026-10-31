import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useResolveClassNames } from 'uniwind'
import NotificationsScreen from './NotificationsScreen'
import NotificationDetails from './NotificationDetails'

const NotificationsStack = createNativeStackNavigator()

const NotificationsNavigator = () => {
  const contentStyle = useResolveClassNames('bg-background')

  return (
    <NotificationsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle,
      }}
    >
      <NotificationsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
      <NotificationsStack.Screen
        name="NotificationDetails"
        component={NotificationDetails}
      />
    </NotificationsStack.Navigator>
  )
}

export default NotificationsNavigator
