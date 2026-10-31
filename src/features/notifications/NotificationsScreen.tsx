import React, { useEffect, useEffectEvent } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { Linking, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import AccountSlider from './AccountSlider'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationsList from './NotificationsList'

const SafeArea = withUniwind(SafeAreaView)

const NotificationsScreen = () => {
  const { t } = useTranslation()
  const { selectedNotification, updateAllNotifications } =
    useNotificationStorage()
  const isFocused = useIsFocused()

  const onFocus = useEffectEvent(() => {
    updateAllNotifications()
  })

  useEffect(() => {
    if (!isFocused) return
    onFocus()
  }, [isFocused])

  const onActionPress = () => {
    if (!selectedNotification?.actionUrl) return
    void Linking.openURL(selectedNotification.actionUrl).catch(console.error)
  }

  const HeaderComponent = (
    <>
      <Text size="xl" className="mb-6 mt-4 text-center">
        {t('notifications.title')}
      </Text>
      <AccountSlider />
    </>
  )

  const FooterComponent =
    selectedNotification?.actionTitle && selectedNotification?.actionUrl ? (
      <View className="absolute bottom-0 mb-8 w-full px-4">
        <Button
          variant="cta"
          size="lg"
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
    <SafeArea className="flex-1 bg-background" edges={['top']}>
      <NotificationsList
        HeaderComponent={HeaderComponent}
        FooterComponent={FooterComponent}
      />
    </SafeArea>
  )
}

export default NotificationsScreen
