import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Check, QrCode } from 'lucide-react-native'
import React from 'react'
import { withUniwind } from 'uniwind'

const CheckIcon = withUniwind(Check)
const QrIcon = withUniwind(QrCode)

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
  if (addressLoading) {
    return <Spinner colorClassName="accent-foreground" />
  }
  if (isValidAddress) {
    return <CheckIcon size={16} colorClassName="accent-blue-dark-500" />
  }
  return (
    <PressableScale onPress={onScanPress} hitSlop={24} feedback="opacity">
      <QrIcon size={16} colorClassName="accent-foreground" />
    </PressableScale>
  )
}

export default AddressExtra
