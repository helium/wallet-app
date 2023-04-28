import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import Box from '@components/Box'
import CloseButton from '@components/CloseButton'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { HomeNavigationProp } from '../home/homeTypes'
import AccountSlider from './AccountSlider'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import NotificationsList from './NotificationsList'

// TODO: When this screen becomes focused, should we query notifications for all accounts?
const NotificationsScreen = () => {
  const { l1Network } = useAppStorage()
  const { t } = useTranslation()
  const safeEdges = useMemo(() => ['top'] as Edge[], [])
  const navigation = useNavigation<HomeNavigationProp>()
  const {
    selectedNotification,
    setSelectedNotification,
    updateAllNotifications,
  } = useNotificationStorage()
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

  const onClose = useCallback(() => {
    navigation.goBack()
    setSelectedNotification(undefined)
  }, [navigation, setSelectedNotification])

  const HeaderComponent = useMemo(() => {
    return (
      <>
        {l1Network === 'helium' && (
          <Box width="100%" alignItems="flex-end" paddingHorizontal="s">
            <CloseButton onPress={onClose} />
          </Box>
        )}
        <Text textAlign="center" variant="h4" marginTop="m" marginBottom="l">
          {t('notifications.title')}
        </Text>
        <AccountSlider />
      </>
    )
  }, [l1Network, onClose, t])

  const FooterComponent = useMemo(() => {
    return selectedNotification?.actionTitle &&
      selectedNotification?.actionUrl ? (
      <Box
        position="absolute"
        bottom={0}
        width="100%"
        paddingHorizontal="m"
        marginBottom="xl"
      >
        <ButtonPressable
          title={selectedNotification.actionTitle}
          onPress={onActionPress}
          backgroundColor="highlight"
          marginTop="m"
          borderRadius="round"
          height={60}
          titleColor="black900"
        />
      </Box>
    ) : (
      <></>
    )
  }, [onActionPress, selectedNotification])

  return (
    <ReAnimatedBox flex={1} entering={DelayedFadeIn}>
      <SafeAreaBox
        flex={1}
        backgroundColor="primaryBackground"
        edges={safeEdges}
      >
        <NotificationsList
          HeaderComponent={HeaderComponent}
          FooterComponent={FooterComponent}
        />
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default memo(NotificationsScreen)
