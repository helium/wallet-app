import { StackNavigationProp } from '@react-navigation/stack'
import { Notification } from '../../generated/graphql'

export const WALLET_UPDATES_ITEM = 'wallet-update'
export const HELIUM_UPDATES_ITEM = 'helium-update'

export type NotificationsListStackParamList = {
  NotificationsList: {
    title: string
  }
  NotificationDetails: {
    notification: Notification
  }
}

export type NotificationsListNavigationProp =
  StackNavigationProp<NotificationsListStackParamList>
