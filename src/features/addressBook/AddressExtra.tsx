import React, { memo } from 'react'
import { ActivityIndicator } from 'react-native'
import QR from '@assets/images/qr.svg'
import Checkmark from '@assets/images/checkmark.svg'
import { useColors, useHitSlop } from '@theme/themeHooks'
import TouchableOpacityBox from '@components/TouchableOpacityBox'

type AddressExtraProps = {
  addressLoading?: boolean
  isValidAddress?: boolean
  onScanPress: () => void
}
const AddressExtra = ({
  addressLoading,
  isValidAddress,
  onScanPress,
}: AddressExtraProps) => {
  const colors = useColors()
  const hitSlop = useHitSlop('6')

  if (addressLoading) {
    return <ActivityIndicator color="gray.800" />
  }
  if (isValidAddress) {
    return <Checkmark color={colors['blue.500']} />
  }
  return (
    <TouchableOpacityBox onPress={onScanPress} hitSlop={hitSlop}>
      <QR width={16} color={colors['base.white']} />
    </TouchableOpacityBox>
  )
}

export default memo(AddressExtra)
