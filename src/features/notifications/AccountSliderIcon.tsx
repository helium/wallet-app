import React from 'react'
import { View } from 'react-native'
import { heliumAddressToSolAddress } from '@helium/spl-utils'
import { PressableScale } from '@ui/PressableScale'
import { twMerge } from '@ui/twMerge'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'

type Props = {
  icon: React.ReactNode
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

  const address = resource || ''
  let key = resource
  try {
    key = heliumAddressToSolAddress(address)
  } catch {}
  const hasUnread = (notificationsByResource[key] || []).some(
    (n) => !n.viewedAt,
  )

  return (
    <>
      <PressableScale
        feedback="opacity"
        onPress={() => onPress(index)}
        accessibilityState={{ selected }}
        className={twMerge(
          'size-16 items-center justify-center rounded-full',
          selected && 'border-2 border-primary',
        )}
      >
        <View className="items-center justify-center rounded-full bg-primary p-0.5">
          {icon}
        </View>
      </PressableScale>
      <View
        className={twMerge(
          'absolute right-3 size-[15px] rounded-full border-2 border-background bg-success-500',
          !hasUnread && 'opacity-0',
        )}
      />
    </>
  )
}

export default AccountSliderIcon
