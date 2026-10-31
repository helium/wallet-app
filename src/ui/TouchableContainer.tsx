import useHaptic from '@hooks/useHaptic'
import React from 'react'
import {
  type GestureResponderEvent,
  type Insets,
  type LayoutChangeEvent,
  Pressable,
  View,
} from 'react-native'
import { twMerge } from './twMerge'

export type TouchableContainerProps = {
  onPress?: ((event: GestureResponderEvent) => void) | null
  hasPressedState?: boolean
  disabled?: boolean
  children: React.ReactNode
  onLayout?: (event: LayoutChangeEvent) => void
  hitSlop?: Insets
  testID?: string
  className?: string
}

// A full-width row press target. With a pressed state, the row shows a
// secondary background that turns to accent while pressed. One light haptic
// fires per press.
export const TouchableContainer = ({
  hasPressedState = true,
  onPress,
  disabled,
  children,
  onLayout,
  hitSlop,
  testID,
  className,
}: TouchableContainerProps) => {
  const { triggerImpact } = useHaptic()

  const handlePress = onPress
    ? (event: GestureResponderEvent) => {
        triggerImpact('light')
        onPress(event)
      }
    : undefined

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={hitSlop}
      className="w-full"
    >
      {({ pressed }) => (
        <View
          onLayout={onLayout}
          className={twMerge(
            hasPressedState && (pressed ? 'bg-accent' : 'bg-secondary'),
            className,
          )}
        >
          {children}
        </View>
      )}
    </Pressable>
  )
}
