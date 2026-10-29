import useHaptic from '@hooks/useHaptic'
import { useReducedMotion } from '@theme/motion'
import React, { useState } from 'react'
import { Pressable, type PressableProps } from 'react-native'
import Animated from 'react-native-reanimated'
import { pressStyle } from './pressStyle'

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
      onPress={
        onPress
          ? (event) => {
              triggerImpact('light')
              onPress(event)
            }
          : undefined
      }
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
        style={pressStyle({ pressed, reducedMotion })}
      >
        {children}
      </Animated.View>
    </Pressable>
  )
}
