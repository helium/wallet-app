import React, { memo, useCallback, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import TriangleTop from '@assets/images/boxTriangleTop.svg'
import BottomSheet from '@gorhom/bottom-sheet'
import { Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import Text from '../../components/Text'
import SafeAreaBox from '../../components/SafeAreaBox'
import Box from '../../components/Box'
import CloseButton from '../../components/CloseButton'
import { HomeNavigationProp } from '../home/homeTypes'
import { useColors } from '../../theme/themeHooks'
import AccountSlider from './AccountSlider'
import NotificationsListNavigator from './NotificationsListNavigator'
import HandleBasic from '../../components/HandleBasic'
import ButtonPressable from '../../components/ButtonPressable'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import useDisappear from '../../utils/useDisappear'

const NotificationsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()
  const colors = useColors()
  const {
    selectedNotification,
    setSelectedNotification,
    onNotificationsClosed,
  } = useNotificationStorage()

  useDisappear(onNotificationsClosed)

  const handleComponent = useCallback(
    () => (
      <Box
        justifyContent="center"
        alignItems="center"
        backgroundColor="surfaceSecondary"
        borderTopLeftRadius="xl"
        borderTopRightRadius="xl"
      >
        <Box position="absolute" top={-11}>
          <TriangleTop color={colors.surfaceSecondary} />
        </Box>
        <HandleBasic marginTop="s" />
      </Box>
    ),
    [colors.surfaceSecondary],
  )

  const onActionPress = useCallback(() => {
    if (!selectedNotification?.actionUrl) return
    Linking.openURL(selectedNotification?.actionUrl)
  }, [selectedNotification])

  const onClose = useCallback(() => {
    navigation.goBack()
    setSelectedNotification(undefined)
  }, [navigation, setSelectedNotification])

  const sheetStyle = useMemo(
    () => ({ backgroundColor: colors.primaryBackground }),
    [colors.primaryBackground],
  )

  return (
    <SafeAreaBox
      flex={1}
      alignItems="center"
      backgroundColor="primaryBackground"
      edges={['top']}
    >
      <Box width="100%" alignItems="flex-end" paddingHorizontal="s">
        <CloseButton onPress={onClose} />
      </Box>
      <Text variant="h4">{t('notifications.title')}</Text>
      <AccountSlider />
      <BottomSheet
        snapPoints={['70%', '90%']}
        handleComponent={handleComponent}
        backgroundStyle={sheetStyle}
      >
        <Box
          flex={1}
          width="100%"
          backgroundColor="surfaceSecondary"
          borderTopLeftRadius="xl"
          borderTopRightRadius="xl"
        >
          <NotificationsListNavigator />
        </Box>
      </BottomSheet>
      {selectedNotification?.actionTitle && selectedNotification?.actionUrl && (
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
      )}
    </SafeAreaBox>
  )
}

export default memo(NotificationsScreen)
