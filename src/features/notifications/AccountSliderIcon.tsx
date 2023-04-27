import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { isAfter } from 'date-fns'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Box from '@components/Box'
import { useNotificationsQuery } from '../../generated/graphql'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'

type Props = {
  icon: Element
  resource: string
  index: number
  onPress: (index: number) => void
  selected: boolean
}
const AccountSliderIcon = ({
  icon,
  index,
  resource,
  onPress,
  selected,
}: Props) => {
  const { currentAccount } = useAccountStorage()
  const { lastViewedTimestamp, markListUnread, unreadLists } =
    useNotificationStorage()

  // TODO: Remove this!!!!!!!!!!!!!!!!
  // TODO: Use new!!!!!!!!!!!!!!!!!!!!!!
  const { data: notifications } = useNotificationsQuery({
    variables: {
      address: currentAccount?.address || '',
      resource,
      limit: 1,
    },
    skip: !currentAccount?.address,
    fetchPolicy: 'cache-and-network',
  })

  const hasUnread = useMemo(() => {
    if (
      !lastViewedTimestamp &&
      notifications?.notifications &&
      notifications.notifications.length > 0
    ) {
      return true
    }

    if (
      lastViewedTimestamp &&
      notifications?.notifications &&
      notifications.notifications[0]
    ) {
      return isAfter(
        new Date(notifications.notifications[0].time),
        new Date(lastViewedTimestamp),
      )
    }
  }, [lastViewedTimestamp, notifications])

  useEffect(() => {
    const notificationResource =
      notifications?.notifications && notifications.notifications[0]?.resource
    if (
      hasUnread &&
      notificationResource &&
      !unreadLists.includes(notificationResource)
    ) {
      markListUnread(notificationResource)
    }
  }, [hasUnread, markListUnread, notifications, resource, unreadLists])

  const selectIcon = useCallback(() => onPress(index), [index, onPress])

  return (
    <>
      <TouchableOpacityBox
        onPress={selectIcon}
        flexDirection="column"
        borderRadius="round"
        borderWidth={selected ? 2 : 0}
        borderColor="white"
        width={64}
        height={64}
        justifyContent="center"
        alignItems="center"
      >
        <Box
          backgroundColor="black"
          borderRadius="round"
          padding="xxs"
          justifyContent="center"
          alignItems="center"
        >
          {icon}
        </Box>
      </TouchableOpacityBox>
      <Box
        position="absolute"
        opacity={hasUnread ? 100 : 0}
        right={12}
        height={15}
        width={15}
        borderWidth={2}
        borderColor="primaryBackground"
        borderRadius="round"
        backgroundColor="malachite"
      />
    </>
  )
}

export default memo(AccountSliderIcon)
