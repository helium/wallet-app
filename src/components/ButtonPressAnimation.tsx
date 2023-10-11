import React from 'react'
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { BoxProps } from '@shopify/restyle'
import Animated from 'react-native-reanimated'
import { Theme } from '@theme/theme'
import useHaptic from '@hooks/useHaptic'
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

  const animation = new Animated.Value(0)
  const inputRange = [0, 1]
  const outputRange = [1, 0.8]
  const scale = animation.interpolate({ inputRange, outputRange })

  const onPressIn = () => {
    triggerImpact('light')
    Animated.spring(animation, {
      toValue: 0.3,
      damping: 10,
      mass: 0.1,
      stiffness: 100,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 2,
    }).start()
  }
  const onPressOut = () => {
    Animated.spring(animation, {
      toValue: 0,
      damping: 10,
      mass: 0.1,
      stiffness: 100,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 2,
    }).start()
  }

  return (
    <ReAnimatedBox
      overflow="hidden"
      style={{ transform: [{ scale }], overflow: 'hidden' }}
      {...boxProps}
    >
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
