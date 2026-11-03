import React, { useEffect, useEffectEvent } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import { Button } from '@ui/Button'
import { CloseButton } from '@ui/CloseButton'
import { Text } from '@ui/Text'
import AccountSlider from './AccountSlider'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationsList from './NotificationsList'
import { openHttpsUrl } from '../../utils/openHttpsUrl'

const SafeArea = withUniwind(TabSafeAreaView)

const NotificationsScreen = () => {
  const { t } = useTranslation()
  const { selectedNotification, updateAllNotifications } =
    useNotificationStorage()
  const isFocused = useIsFocused()
  const navigation = useNavigation()

  const onFocus = useEffectEvent(() => {
    updateAllNotifications()
  })

  useEffect(() => {
    if (!isFocused) return
    onFocus()
  }, [isFocused])

  const onActionPress = () => openHttpsUrl(selectedNotification?.actionUrl)

  const HeaderComponent = (
    <>
      <View className="mb-6 mt-4 flex-row items-center px-4">
        <CloseButton
          testID="Notifications.Close"
          accessibilityLabel={t('generic.close')}
          onPress={navigation.goBack}
        />
        <Text size="xl" className="flex-1 text-center">
          {t('notifications.title')}
        </Text>
        <View className="size-11" />
      </View>
      <AccountSlider />
    </>
  )

  const FooterComponent =
    selectedNotification?.actionTitle && selectedNotification?.actionUrl ? (
      <View className="absolute bottom-0 mb-8 w-full px-4">
        <Button
          variant="cta"
          size="dashboard"
          className="mt-4 w-full"
          onPress={onActionPress}
        >
          {selectedNotification.actionTitle}
        </Button>
      </View>
    ) : (
      <></>
    )

  return (
    <SafeArea className="flex-1 bg-background" edges={['top', 'bottom']}>
      <NotificationsList
        HeaderComponent={HeaderComponent}
        FooterComponent={FooterComponent}
      />
    </SafeArea>
  )
}

export default NotificationsScreen
