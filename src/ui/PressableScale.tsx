import useHaptic from '@hooks/useHaptic'
import { useReducedMotion } from '@theme/motion'
import React, { useState } from 'react'
import { Pressable, type PressableProps } from 'react-native'
import Animated from 'react-native-reanimated'
import { type PressFeedback, pressStyle, pressWithHaptic } from './pressStyle'

export type PressableScaleProps = Omit<
  PressableProps,
  'children' | 'style' | 'className'
> & {
  className?: string
  children: React.ReactNode
  feedback?: PressFeedback
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// The press primitive for buttons, FABs and cards. `className` styles and
// sizes the press target, which is also the scaled view. One light haptic
// fires per committed press (onPress).
export const PressableScale = ({
  className,
  children,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  feedback,
  ...props
}: PressableScaleProps) => {
  const [pressed, setPressed] = useState(false)
  const reducedMotion = useReducedMotion()
  const { triggerImpact } = useHaptic()

  return (
    <AnimatedPressable
      accessibilityRole="button"
      pressRetentionOffset={16}
      {...props}
      disabled={disabled}
      onPress={pressWithHaptic(onPress, () => triggerImpact('light'))}
      onPressIn={(event) => {
        setPressed(true)
        onPressIn?.(event)
      }}
      onPressOut={(event) => {
        setPressed(false)
        onPressOut?.(event)
      }}
      className={className}
      style={pressStyle({
        pressed,
        reducedMotion,
        disabled: !!disabled,
        feedback,
      })}
    >
      {children}
    </AnimatedPressable>
  )
}
