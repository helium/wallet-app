/* eslint-disable react/jsx-props-no-spreading */
import React, { memo } from 'react'
import Close from '@assets/svgs/closeModal.svg'
import { GestureResponderEvent, Insets } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import { useColors } from '@config/theme/themeHooks'
import { Color, Theme } from '@config/theme/theme'
import IconPressedContainer from './IconPressedContainer'
import Box from './Box'

export type CloseButtonProps = {
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  hitSlop?: Insets | undefined
  color?: Color
} & BoxProps<Theme>

const CloseButton = ({
  onPress,
  hitSlop,
  color = 'primaryText',
  ...props
}: CloseButtonProps) => {
  const colors = useColors()
  return (
    <Box hitSlop={hitSlop} {...props}>
      <IconPressedContainer
        onPress={onPress}
        idleOpacity={0.75}
        activeOpacity={0.9}
      >
        <Close color={colors[color]} />
      </IconPressedContainer>
    </Box>
  )
}

export default memo(CloseButton)
