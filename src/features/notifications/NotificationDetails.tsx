import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { formatDistance } from 'date-fns'
import Text from '../../components/Text'
import Box from '../../components/Box'
import { NotificationsListStackParamList } from './notificationTypes'
import BackButton from '../../components/BackButton'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationDetailBanner from './NotificationDetailBanner'
import usePrevious from '../../utils/usePrevious'

type Route = RouteProp<NotificationsListStackParamList, 'NotificationDetails'>

const NotificationDetails = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation()
  const { notification } = route.params
  const { setSelectedNotification, selectedList } = useNotificationStorage()
  const prevSelectedList = usePrevious(selectedList)

  useEffect(() => {
    if (prevSelectedList && selectedList !== prevSelectedList) {
      navigation.goBack()
    }
  }, [navigation, selectedList, prevSelectedList])

  const onBacKPress = useCallback(() => {
    navigation.goBack()
    setSelectedNotification(undefined)
  }, [navigation, setSelectedNotification])

  const bodyStyle = useMemo(
    () => ({ paddingBottom: notification.actionTitle ? 90 : 0 }),
    [notification],
  )

  const time = useMemo(
    () =>
      formatDistance(notification.time, new Date(), {
        addSuffix: true,
      }),
    [notification],
  )

  return (
    <Box
      backgroundColor="surfaceSecondary"
      flex={1}
      paddingHorizontal="m"
      paddingTop="m"
    >
      <BackButton
        onPress={onBacKPress}
        color="surfaceSecondaryText"
        fontSize={18}
        paddingHorizontal="none"
        marginBottom="m"
      />
      <BottomSheetScrollView>
        <NotificationDetailBanner icon={notification.icon} />
        <Text variant="h3" marginTop="m" adjustsFontSizeToFit numberOfLines={2}>
          {notification.title}
        </Text>
        <Text variant="body2" paddingVertical="m" color="greenBright500">
          {time}
        </Text>
        <Text
          variant="body2"
          color="surfaceSecondaryText"
          style={bodyStyle}
          marginBottom="xl"
        >
          {notification.body}
        </Text>
      </BottomSheetScrollView>
    </Box>
  )
}

export default memo(NotificationDetails)
