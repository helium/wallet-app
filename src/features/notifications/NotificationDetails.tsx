import React, { memo, useEffect, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { formatDistanceToNow, parseISO } from 'date-fns'
import Animated from 'react-native-reanimated'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import Box from '../../components/Box'
import { NotificationsListStackParamList } from './notificationTypes'
import BackButton from '../../components/BackButton'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationDetailBanner from './NotificationDetailBanner'
import usePrevious from '../../utils/usePrevious'
import parseMarkup from '../../utils/parseMarkup'
import { usePostNotificationReadMutation } from '../../store/slices/walletRestApi'
import useMount from '../../utils/useMount'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'

type Route = RouteProp<NotificationsListStackParamList, 'NotificationDetails'>

const NotificationDetails = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation()
  const { notification } = route.params
  const { setSelectedNotification, selectedList } = useNotificationStorage()
  const [markAsRead] = usePostNotificationReadMutation()
  const { l1Network } = useAppStorage()
  const prevSelectedList = usePrevious(selectedList)

  useMount(() => {
    if (l1Network === 'helium') return

    markAsRead({ id: notification.id })
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

  const bodyStyle = useMemo(
    () => ({ paddingBottom: notification.actionTitle ? 90 : 0 }),
    [notification],
  )

  const time = useMemo(
    () =>
      formatDistanceToNow(parseISO(notification.time), {
        addSuffix: true,
      }),
    [notification],
  )

  return (
    <Animated.View entering={DelayedFadeIn} style={globalStyles.container}>
      <SafeAreaBox
        backgroundColor="primaryBackground"
        flex={1}
        paddingHorizontal="l"
        paddingTop="m"
      >
        <BackButton
          onPress={navigation.goBack}
          color="surfaceSecondaryText"
          paddingHorizontal="none"
          marginBottom="m"
        />

        <Box marginHorizontal="m">
          <NotificationDetailBanner icon={notification.icon} />
          <Text
            variant="h3"
            marginTop="m"
            adjustsFontSizeToFit
            numberOfLines={2}
          >
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
            {parseMarkup(notification.body)}
          </Text>
        </Box>
      </SafeAreaBox>
    </Animated.View>
  )
}

export default memo(NotificationDetails)
