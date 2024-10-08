import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import Text from '@components/Text'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import { ReAnimatedBox } from '@components/AnimatedBox'
import AccountSlider from './AccountSlider'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationsList from './NotificationsList'

const NotificationsScreen = () => {
  const { t } = useTranslation()
  const { selectedNotification, updateAllNotifications } =
    useNotificationStorage()
  const isFocused = useIsFocused()

  useEffect(() => {
    if (!isFocused) return
    updateAllNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused])

  const onActionPress = useCallback(() => {
    if (!selectedNotification?.actionUrl) return
    Linking.openURL(selectedNotification?.actionUrl)
  }, [selectedNotification])

  const HeaderComponent = useMemo(() => {
    return (
      <>
        <Text
          textAlign="center"
          variant="textXlRegular"
          marginTop="6xl"
          marginBottom="6"
          color="primaryText"
        >
          {t('notifications.title')}
        </Text>
        <AccountSlider />
      </>
    )
  }, [t])

  const FooterComponent = useMemo(() => {
    return selectedNotification?.actionTitle &&
      selectedNotification?.actionUrl ? (
      <Box
        position="absolute"
        bottom={0}
        width="100%"
        paddingHorizontal="4"
        marginBottom="8"
      >
        <ButtonPressable
          title={selectedNotification.actionTitle}
          onPress={onActionPress}
          backgroundColor="yellow.500"
          marginTop="4"
          borderRadius="full"
          height={60}
          titleColor="base.black"
        />
      </Box>
    ) : (
      <></>
    )
  }, [onActionPress, selectedNotification])

  return (
    <ReAnimatedBox flex={1} entering={DelayedFadeIn}>
      <Box flex={1} backgroundColor="primaryBackground">
        <NotificationsList
          HeaderComponent={HeaderComponent}
          FooterComponent={FooterComponent}
        />
      </Box>
    </ReAnimatedBox>
  )
}

export default memo(NotificationsScreen)
