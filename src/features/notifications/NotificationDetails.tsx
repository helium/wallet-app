import React, { memo, useEffect, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { formatDistanceToNow, parseISO } from 'date-fns'
import Animated from 'react-native-reanimated'
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
      <Box
        backgroundColor="primaryBackground"
        flex={1}
        paddingHorizontal="6"
        paddingTop="6xl"
      >
        <BackButton
          onPress={navigation.goBack}
          color="secondaryText"
          paddingHorizontal="0"
          marginBottom="4"
        />

        <Box marginHorizontal="4">
          <NotificationDetailBanner icon={notification.icon} />
          <Text
            variant="displayXsRegular"
            marginTop="4"
            adjustsFontSizeToFit
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <Text
            variant="textSmRegular"
            paddingVertical="4"
            color="green.light-500"
          >
            {time}
          </Text>
          <Text
            variant="textSmRegular"
            color="secondaryText"
            style={bodyStyle}
            marginBottom="8"
          >
            {parseMarkup(notification.body)}
          </Text>
        </Box>
      </Box>
    </Animated.View>
  )
}

export default memo(NotificationDetails)
