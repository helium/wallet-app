import { Check } from 'lucide-react-native'
import React from 'react'
import { Pressable, type PressableProps } from 'react-native'
import { withUniwind } from 'uniwind'
import { checkboxClassName } from './checkboxVariants'

const CheckIcon = withUniwind(Check)

export type CheckboxProps = Omit<PressableProps, 'onPress' | 'children'> & {
  checked: boolean
  onChange: (checked: boolean) => void
}

// World's Checkbox on React Native Pressable. A press reports the opposite of
// `checked`; the caller owns the state.
export const Checkbox = ({
  checked,
  onChange,
  className,
  ...props
}: CheckboxProps) => (
  <Pressable
    {...props}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    onPress={() => onChange(!checked)}
    className={checkboxClassName(checked, className)}
  >
    {checked ? (
      <CheckIcon size={14} colorClassName="accent-primary-foreground" />
    ) : null}
  </Pressable>
)
