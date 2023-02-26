import { BoxProps } from '@shopify/restyle'
import React, { useCallback } from 'react'
import {
  GestureResponderEvent,
  Insets,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { useCreateOpacity } from '@theme/themeHooks'
import useHaptic from '@hooks/useHaptic'
import { Theme } from '@theme/theme'
import Box from './Box'

export type ButtonPressAnimationProps = {
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  hasPressedState?: boolean
  disabled?: boolean
  children: React.ReactNode
  pressableStyles?: ViewStyle
  onLayout?: (event: LayoutChangeEvent) => void | undefined
  hitSlop?: Insets | undefined
} & BoxProps<Theme>

const TouchableContainer = ({
  hasPressedState = true,
  onPress,
  disabled,
  children,
  pressableStyles,
  onLayout,
  hitSlop,
  ...boxProps
}: ButtonPressAnimationProps) => {
  const { triggerImpact } = useHaptic()

  const onTouchEnd = useCallback(() => {
    triggerImpact('light')
  }, [triggerImpact])

  const { backgroundStyle: generateBackgroundStyle } = useCreateOpacity()

  const getBackgroundColorStyle = useCallback(
    (pressed: boolean) => {
      if (!hasPressedState) return undefined

      if (pressed) {
        return generateBackgroundStyle('black500', 1.0)
      }
      return generateBackgroundStyle('surfaceSecondary', 1.0)
    },
    [generateBackgroundStyle, hasPressedState],
  )

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onTouchEnd={onTouchEnd}
      style={pressableStyles || styles.pressable}
    >
      {({ pressed }) => (
        <Box
          style={getBackgroundColorStyle(pressed)}
          onLayout={onLayout}
          hitSlop={hitSlop}
          {...boxProps}
        >
          {children}
        </Box>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({ pressable: { width: '100%' } })

export default TouchableContainer
