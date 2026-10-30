import useHaptic from '@hooks/useHaptic'
import { useReducedMotion } from '@theme/motion'
import React, { useState } from 'react'
import { Pressable, type PressableProps } from 'react-native'
import Animated from 'react-native-reanimated'
import { pressStyle, pressWithHaptic } from './pressStyle'

export type PressableScaleProps = Omit<
  PressableProps,
  'children' | 'style' | 'className'
> & {
  className?: string
  children: React.ReactNode
}

// The press primitive for buttons, FABs and cards. `className` styles the
// scaled view. One light haptic fires per committed press (onPress).
export const PressableScale = ({
  className,
  children,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) => {
  const [pressed, setPressed] = useState(false)
  const reducedMotion = useReducedMotion()
  const { triggerImpact } = useHaptic()

  return (
    <Pressable
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
    >
      <Animated.View
        className={className}
        style={pressStyle({ pressed, reducedMotion, disabled: !!disabled })}
      >
        {children}
      </Animated.View>
    </Pressable>
  )
}
