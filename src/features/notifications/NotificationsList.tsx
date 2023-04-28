import React, { memo, useCallback, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { SectionList } from 'react-native'
import Box from '@components/Box'
import Text from '@components/Text'
import { useSpacing } from '@theme/themeHooks'
import FadeInOut from '@components/FadeInOut'
import useHaptic from '@hooks/useHaptic'
import { NotificationsListNavigationProp } from './notificationTypes'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationListItem from './NotificationListItem'
import { Notification } from '../../utils/walletApiV2'

export type NotificationsListProps = {
  HeaderComponent: JSX.Element
  FooterComponent: JSX.Element
}

const NotificationsList = ({
  HeaderComponent,
  FooterComponent,
}: NotificationsListProps) => {
  const { t } = useTranslation()
  const navigator = useNavigation<NotificationsListNavigationProp>()
  const { setSelectedNotification, notifications } = useNotificationStorage()
  const spacing = useSpacing()
  const { triggerImpact } = useHaptic()

  const contentContainer = useMemo(
    () => ({
      paddingBottom: spacing.xxxl,
    }),
    [spacing.xxxl],
  )

  const SectionData = useMemo((): {
    title: string
    data: Notification[]
  }[] => {
    // Group by date
    const grouped = notifications.reduce((acc, noti) => {
      const date = new Date(noti.time)

      const key = date.toDateString()
      if (!acc[key]) {
        acc[key] = []
      }

      if (!noti) return acc

      acc[key].push(noti as Notification)
      return acc
    }, {} as Record<string, Notification[]>)

    // Create array of objects
    const sections = Object.keys(grouped).map((date) => {
      return {
        title: date,
        data: grouped[date],
      }
    })

    return sections
  }, [notifications])

  const renderItem = useCallback(
    ({ index, item, section }) => {
      const notification = item as Notification
      const isFirst = index === 0
      const isLast = index === section.data.length - 1

      const onItemSelected = () => {
        triggerImpact('light')
        navigator.navigate('NotificationDetails', { notification: item })
        setSelectedNotification(item)
      }

      return (
        <FadeInOut>
          <NotificationListItem
            marginHorizontal="m"
            borderTopStartRadius={isFirst ? 'xl' : undefined}
            borderTopEndRadius={isFirst ? 'xl' : undefined}
            borderBottomStartRadius={isLast ? 'xl' : undefined}
            borderBottomEndRadius={isLast ? 'xl' : undefined}
            notification={notification}
            viewed={!!notification.viewedAt}
            hasDivider={!isLast || (isFirst && section.data.length !== 1)}
            onPress={onItemSelected}
          />
        </FadeInOut>
      )
    },
    [navigator, setSelectedNotification, triggerImpact],
  )

  const EmptyListView = useCallback(
    () => (
      <FadeInOut>
        <Box alignItems="center">
          <Text color="primaryText" marginTop="xl">
            {t('notifications.emptyTitle')}
          </Text>
        </Box>
      </FadeInOut>
    ),
    [t],
  )

  const renderSectionHeader = useCallback(
    ({ section: { title: sectionTitle, icon } }) => (
      <FadeInOut>
        <Box
          flexDirection="row"
          alignItems="center"
          paddingTop="xl"
          paddingBottom="m"
          paddingHorizontal="l"
          backgroundColor="primaryBackground"
          justifyContent="center"
        >
          {icon !== undefined && icon}
          <Text variant="body2" textAlign="center" color="secondaryText">
            {sectionTitle}
          </Text>
        </Box>
      </FadeInOut>
    ),
    [],
  )

  const keyExtractor = useCallback((item, index) => item.time + index, [])

  return (
    <Box flex={1}>
      {HeaderComponent}
      <SectionList
        keyExtractor={keyExtractor}
        ListFooterComponent={FooterComponent}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={contentContainer}
        sections={SectionData}
        renderItem={renderItem}
        ListEmptyComponent={EmptyListView}
      />
    </Box>
  )
}

export default memo(NotificationsList)
