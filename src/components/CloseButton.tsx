import React, { memo } from 'react'
import Close from '@assets/images/closeModal.svg'
import { GestureResponderEvent, Insets } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import { useColors } from '@theme/themeHooks'
import { Theme } from '@theme/theme'
import IconPressedContainer from './IconPressedContainer'
import Box from './Box'

export type CloseButtonProps = {
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  hitSlop?: Insets | undefined
  testID?: string
} & BoxProps<Theme>

const CloseButton = ({
  onPress,
  hitSlop,
  testID,
  ...props
}: CloseButtonProps) => {
  const { primaryText } = useColors()
  return (
    <Box hitSlop={hitSlop} {...props}>
      <IconPressedContainer
        testID={testID}
        onPress={onPress}
        idleOpacity={0.75}
        activeOpacity={0.9}
      >
        <Close color={primaryText} />
      </IconPressedContainer>
    </Box>
  )
}

export default memo(CloseButton)
