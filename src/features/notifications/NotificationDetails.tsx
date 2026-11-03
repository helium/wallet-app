import React, { useEffect } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ChevronLeft } from 'lucide-react-native'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import usePrevious from '@hooks/usePrevious'
import useMount from '@hooks/useMount'
import { NotificationsListStackParamList } from './notificationTypes'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationDetailBanner from './NotificationDetailBanner'
import parseMarkup from '../../utils/parseMarkup'

const SafeArea = withUniwind(TabSafeAreaView)
const BackIcon = withUniwind(ChevronLeft)

type Route = RouteProp<NotificationsListStackParamList, 'NotificationDetails'>

const NotificationDetails = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation()
  const { notification } = route.params
  const {
    setSelectedNotification,
    selectedList,
    apiResource,
    markNotificationRead,
  } = useNotificationStorage()
  const prevSelectedList = usePrevious(selectedList)

  useMount(() => {
    markNotificationRead({ resource: apiResource, id: notification.id })
  })

  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      setSelectedNotification(undefined)
    })
  }, [navigation, setSelectedNotification])

  useEffect(() => {
    if (prevSelectedList && selectedList !== prevSelectedList) {
      navigation.goBack()
    }
  }, [navigation, selectedList, prevSelectedList])

  const time = formatDistanceToNow(parseISO(notification.time), {
    addSuffix: true,
  })

  return (
    <SafeArea className="flex-1 bg-background px-6 pt-4">
      <View className="mb-4 items-start">
        <PressableScale
          onPress={navigation.goBack}
          hitSlop={24}
          feedback="opacity"
          accessibilityLabel={t('generic.back')}
        >
          <BackIcon size={24} colorClassName="accent-muted-foreground" />
        </PressableScale>
      </View>

      <View className="mx-4">
        <NotificationDetailBanner icon={notification.icon} />
        <Text
          size="2xl"
          className="mt-4"
          adjustsFontSizeToFit
          numberOfLines={2}
        >
          {notification.title}
        </Text>
        <Text className="py-4 text-success-500">{time}</Text>
        <Text
          className={twMerge(
            'mb-8 text-muted-foreground',
            notification.actionTitle && 'pb-[90px]',
          )}
        >
          {parseMarkup(notification.body)}
        </Text>
      </View>
    </SafeArea>
  )
}

export default NotificationDetails
