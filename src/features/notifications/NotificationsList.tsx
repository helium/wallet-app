import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { SectionList, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { NotificationsListNavigationProp } from './notificationTypes'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationListItem from './NotificationListItem'
import { Notification } from '../../utils/walletApiV2'

export type NotificationsListProps = {
  HeaderComponent: React.JSX.Element
  FooterComponent: React.JSX.Element
}

const keyExtractor = (item: Notification, index: number) => item.time + index

const NotificationsList = ({
  HeaderComponent,
  FooterComponent,
}: NotificationsListProps) => {
  const { t } = useTranslation()
  const navigator = useNavigation<NotificationsListNavigationProp>()
  const { setSelectedNotification, notifications } = useNotificationStorage()

  // Group by date
  const grouped = notifications.reduce(
    (acc, noti) => {
      const date = new Date(noti.time)

      const key = date.toDateString()
      if (!acc[key]) {
        acc[key] = []
      }

      if (!noti) return acc

      acc[key].push(noti as Notification)
      return acc
    },
    {} as Record<string, Notification[]>,
  )

  const sections = Object.keys(grouped).map((date) => ({
    title: date,
    data: grouped[date],
  }))

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      navigator.navigate('NotificationDetails', { notification })
      setSelectedNotification(notification)
    },
    [navigator, setSelectedNotification],
  )

  const renderItem = useCallback(
    ({
      index,
      item,
      section,
    }: {
      index: number
      item: Notification
      section: { data: Notification[] }
    }) => {
      const isFirst = index === 0
      const isLast = index === section.data.length - 1

      return (
        <NotificationListItem
          className={twMerge(
            isFirst && 'rounded-t-[20px]',
            isLast && 'rounded-b-[20px]',
          )}
          notification={item}
          viewed={!!item.viewedAt}
          hasDivider={!isLast || (isFirst && section.data.length !== 1)}
          onPress={handleNotificationPress}
        />
      )
    },
    [handleNotificationPress],
  )

  const emptyList = (
    <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
      <View className="items-center">
        <Text className="mt-8">{t('notifications.emptyTitle')}</Text>
      </View>
    </Animated.View>
  )

  const renderSectionHeader = ({
    section: { title: sectionTitle },
  }: {
    section: { title: string }
  }) => (
    <View className="flex-row items-center justify-center bg-background px-6 pb-4 pt-8">
      <Text className="text-center text-muted-foreground">{sectionTitle}</Text>
    </View>
  )

  return (
    <View className="flex-1">
      {HeaderComponent}
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={keyExtractor}
        ListFooterComponent={FooterComponent}
        renderSectionHeader={renderSectionHeader}
        contentContainerClassName="pb-15"
        sections={sections}
        renderItem={renderItem}
        ListEmptyComponent={emptyList}
      />
    </View>
  )
}

export default NotificationsList
