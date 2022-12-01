import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import Animated from 'react-native-reanimated'
import Text from '../../components/Text'
import SafeAreaBox from '../../components/SafeAreaBox'
import Box from '../../components/Box'
import CloseButton from '../../components/CloseButton'
import { HomeNavigationProp } from '../home/homeTypes'
import AccountSlider from './AccountSlider'
import ButtonPressable from '../../components/ButtonPressable'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import NotificationsList from './NotificationsList'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'

const NotificationsScreen = () => {
  const { l1Network } = useAppStorage()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()
  const {
    selectedNotification,
    setSelectedNotification,
    onNotificationsClosed,
  } = useNotificationStorage()

  useEffect(() => {
    return navigation.addListener('beforeRemove', onNotificationsClosed)
  }, [navigation, onNotificationsClosed, setSelectedNotification])

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
    <Animated.View entering={DelayedFadeIn} style={globalStyles.container}>
      <SafeAreaBox flex={1} backgroundColor="primaryBackground" edges={['top']}>
        <NotificationsList
          HeaderComponent={HeaderComponent}
          FooterComponent={FooterComponent}
        />
      </SafeAreaBox>
    </Animated.View>
  )
}

export default memo(NotificationsScreen)
