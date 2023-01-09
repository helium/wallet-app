import { BoxProps } from '@shopify/restyle'
import React, { useCallback } from 'react'
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { useCreateOpacity } from '../theme/themeHooks'
import useHaptic from '../hooks/useHaptic'
import Box from './Box'
import { Theme } from '../theme/theme'

export type ButtonPressAnimationProps = {
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  disabled?: boolean
  children: React.ReactNode
  pressableStyles?: ViewStyle
  onLayout?: (event: LayoutChangeEvent) => void | undefined
} & BoxProps<Theme>

const TouchableContainer = ({
  onPress,
  disabled,
  children,
  pressableStyles,
  onLayout,
  ...boxProps
}: ButtonPressAnimationProps) => {
  const { triggerImpact } = useHaptic()

  const onTouchEnd = useCallback(() => {
    triggerImpact()
  }, [triggerImpact])

  const { backgroundStyle: generateBackgroundStyle } = useCreateOpacity()

  const getBackgroundColorStyle = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        return generateBackgroundStyle('black500', 1.0)
      }
      return generateBackgroundStyle('surfaceSecondary', 1.0)
    },
    [generateBackgroundStyle],
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
