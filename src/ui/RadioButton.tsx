import React from 'react'
import { Pressable, type PressableProps, View } from 'react-native'
import { radioButtonClassName } from './radioButtonVariants'

export type RadioButtonProps = Omit<PressableProps, 'onPress' | 'children'> & {
  selected: boolean
  onSelect: () => void
}

// World's radio on React Native Pressable. A press reports a selection; the
// caller owns the state.
export const RadioButton = ({
  selected,
  onSelect,
  className,
  ...props
}: RadioButtonProps) => (
  <Pressable
    {...props}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    onPress={onSelect}
    className={radioButtonClassName(selected, className)}
  >
    {selected ? <View className="size-2 rounded-full bg-primary" /> : null}
  </Pressable>
)
