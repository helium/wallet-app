import React, { memo } from 'react'
import { ActivityIndicator } from 'react-native'
import QR from '@assets/images/qr.svg'
import Checkmark from '@assets/images/checkmark.svg'
import { useColors } from '../../theme/themeHooks'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'

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

  if (addressLoading) {
    return <ActivityIndicator color="black500" />
  }
  if (isValidAddress) {
    return <Checkmark color={colors.blueBright500} />
  }
  return (
    <TouchableOpacityBox onPress={onScanPress}>
      <QR width={16} color={colors.white} />
    </TouchableOpacityBox>
  )
}

export default memo(AddressExtra)
