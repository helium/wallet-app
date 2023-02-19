import { BoxProps } from '@shopify/restyle'
import React, { useCallback, useState } from 'react'
import {
  GestureResponderEvent,
  Insets,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import useHaptic from '@hooks/useHaptic'
import { Theme } from '@theme/theme'
import { ReAnimatedBox } from './AnimatedBox'

export const ICON_CONTAINER_SIZE = 44

export type ButtonPressAnimationProps = {
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  disabled?: boolean
  children?: React.ReactNode
  pressableStyles?: ViewStyle
  onLayout?: (event: LayoutChangeEvent) => void | undefined
  hitSlop?: Insets | undefined
  activeOpacity?: number
  idleOpacity?: number
} & BoxProps<Theme>

const IconPressedContainer = ({
  onPress,
  disabled,
  children,
  pressableStyles,
  onLayout,
  hitSlop,
  activeOpacity = 0.75,
  idleOpacity = 0.35,
  ...boxProps
}: ButtonPressAnimationProps) => {
  const { triggerImpact } = useHaptic()
  const [iconPressed, setIconPressed] = useState(false)

  const onTouchEnd = useCallback(() => {
    triggerImpact()
  }, [triggerImpact])

  const handleIconPressed = useCallback(
    (pressed: boolean) => () => {
      setIconPressed(pressed)
    },
    [],
  )

  const iconPressedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(iconPressed ? activeOpacity : idleOpacity),
    }
  })

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handleIconPressed(true)}
      onPressOut={handleIconPressed(false)}
      disabled={disabled}
      onTouchEnd={onTouchEnd}
      style={pressableStyles || styles.pressable}
    >
      {() => (
        <ReAnimatedBox
          onLayout={onLayout}
          hitSlop={hitSlop}
          style={iconPressedStyle}
          {...boxProps}
        >
          {children}
        </ReAnimatedBox>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    height: ICON_CONTAINER_SIZE,
    width: ICON_CONTAINER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default IconPressedContainer
