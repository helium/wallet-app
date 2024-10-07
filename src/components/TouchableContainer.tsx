import useHaptic from '@hooks/useHaptic'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { useCreateOpacity } from '@theme/themeHooks'
import React, { useCallback } from 'react'
import {
  GestureResponderEvent,
  Insets,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
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
  backgroundColor = 'cardBackground',
  backgroundColorPressed = 'bg.primary-hover',
  ...boxProps
}: ButtonPressAnimationProps & {
  backgroundColorPressed?: BoxProps<Theme>['backgroundColor']
}) => {
  const { triggerImpact } = useHaptic()

  const onTouchEnd = useCallback(() => {
    triggerImpact('light')
  }, [triggerImpact])

  const { backgroundStyle: generateBackgroundStyle } = useCreateOpacity()

  const getBackgroundColorStyle = useCallback(
    (pressed: boolean) => {
      if (!hasPressedState) return undefined

      if (pressed) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return generateBackgroundStyle(backgroundColorPressed, 1.0)
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return generateBackgroundStyle(backgroundColor, 1.0)
    },
    [
      generateBackgroundStyle,
      hasPressedState,
      backgroundColor,
      backgroundColorPressed,
    ],
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
