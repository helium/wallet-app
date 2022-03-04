import React, { memo, useCallback } from 'react'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import Box from '../../components/Box'

type Props = {
  icon: Element
  index: number
  onPress: (index: number) => void
  hasUnread: boolean
}
const AccountSliderIcon = ({ icon, index, onPress, hasUnread }: Props) => {
  const selectIcon = useCallback(() => onPress(index), [index, onPress])
  return (
    <>
      <TouchableOpacityBox onPress={selectIcon} flexDirection="column">
        {icon}
      </TouchableOpacityBox>
      <Box
        position="absolute"
        opacity={hasUnread ? 100 : 0}
        right={15}
        height={15}
        width={15}
        borderWidth={2}
        borderColor="primaryBackground"
        borderRadius="round"
        backgroundColor="red500"
      />
    </>
  )
}

export default memo(AccountSliderIcon)
