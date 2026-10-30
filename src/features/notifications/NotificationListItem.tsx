import React from 'react'
import { format } from 'date-fns'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { View } from 'react-native'
import parseMarkup from '../../utils/parseMarkup'
import { Notification } from '../../utils/walletApiV2'

export type NotificationListItemProps = {
  notification: Notification
  viewed?: boolean
  hasDivider?: boolean
  className?: string
  onPress: () => void
}

const NotificationListItem = ({
  notification,
  viewed,
  hasDivider,
  className,
  onPress,
}: NotificationListItemProps) => {
  const date = new Date(notification.time)
  // To local time
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  const time = format(date, 'hh:mm a')

  return (
    <PressableScale
      feedback="opacity"
      onPress={onPress}
      className={twMerge(
        'flex-row bg-secondary p-4',
        hasDivider && 'border-b border-border',
        className,
      )}
    >
      <View className="ms-2 grow basis-0 justify-center">
        <View className="mb-1 flex-row items-center">
          {!viewed && (
            <View className="mr-1 size-2.5 rounded-full bg-success-500" />
          )}
          <Text className="font-medium" adjustsFontSizeToFit allowFontScaling>
            {notification.title}
          </Text>
        </View>
        <Text size="xs" className="text-muted-foreground" numberOfLines={2}>
          {parseMarkup(notification.body)}
        </Text>
      </View>
      <Text className="ps-2 text-[10px] italic text-muted-foreground">
        {time}
      </Text>
    </PressableScale>
  )
}

export default NotificationListItem
