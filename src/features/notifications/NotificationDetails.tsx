import React, { memo, useEffect, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { formatDistanceToNow, parseISO } from 'date-fns'
import Animated from 'react-native-reanimated'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import Box from '@components/Box'
import BackButton from '@components/BackButton'
import usePrevious from '@hooks/usePrevious'
import useMount from '@hooks/useMount'
import { DelayedFadeIn } from '@components/FadeInOut'
import globalStyles from '@theme/globalStyles'
import { NotificationsListStackParamList } from './notificationTypes'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import NotificationDetailBanner from './NotificationDetailBanner'
import parseMarkup from '../../utils/parseMarkup'
import { useAppDispatch } from '../../store/store'
import { markNotificationRead } from '../../store/slices/notificationsSlice'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

type Route = RouteProp<NotificationsListStackParamList, 'NotificationDetails'>

const NotificationDetails = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation()
  const { notification } = route.params
  const { setSelectedNotification, selectedList, apiResource } =
    useNotificationStorage()
  const { sortedAccounts } = useAccountStorage()
  const dispatch = useAppDispatch()
  const prevSelectedList = usePrevious(selectedList)

  useMount(() => {
    dispatch(
      markNotificationRead({
        resource: apiResource,
        id: notification.id,
        accounts: sortedAccounts,
      }),
    )
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
