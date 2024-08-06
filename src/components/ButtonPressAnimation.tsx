import useHaptic from '@hooks/useHaptic'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React from 'react'
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { ReAnimatedBox } from './AnimatedBox'

export type ButtonPressAnimationProps = {
  onPress: ((event: GestureResponderEvent) => void) | null | undefined
  disabled?: boolean
  children: React.ReactNode
  pressableStyles?: ViewStyle
} & BoxProps<Theme>

const ButtonPressAnimation = ({
  onPress,
  disabled,
  children,
  pressableStyles,
  ...boxProps
}: ButtonPressAnimationProps) => {
  const { triggerImpact } = useHaptic()

  const animation = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - animation.value * 0.2 }],
  }))

  const onPressIn = () => {
    triggerImpact('light')
    animation.value = withSpring(0.3)
  }
  const onPressOut = () => {
    animation.value = withSpring(0)
  }

  return (
    <ReAnimatedBox overflow="hidden" style={animatedStyle} {...boxProps}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={pressableStyles || styles.pressable}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </ReAnimatedBox>
  )
}

const styles = StyleSheet.create({ pressable: { width: '100%' } })

export default ButtonPressAnimation
