import { StackNavigationProp } from '@react-navigation/stack'
import { Notification } from '../../utils/walletApiV2'

export const WALLET_UPDATES_ITEM = 'wallet-update'
export const HELIUM_UPDATES_ITEM = 'helium-update'

export type NotificationsListStackParamList = {
  NotificationDetails: {
    notification: Notification
  }
}

export type NotificationsListNavigationProp =
  StackNavigationProp<NotificationsListStackParamList>
