import React, { memo, useCallback, useMemo } from 'react'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Box from '@components/Box'
import { heliumAddressToSolAddress } from '@helium/spl-utils'
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
  const { notificationsByResource } = useNotificationStorage()

  const hasUnread = useMemo(() => {
    let key = resource
    try {
      key = heliumAddressToSolAddress(resource || '')
    } catch {}

    const notifications = notificationsByResource[key] || []

    return notifications.find((n) => !n.viewedAt)
  }, [notificationsByResource, resource])

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
