import { getMaxFontSizeMultiplier } from '@utils/layout'
import React from 'react'
import { TextInput } from 'react-native'
import { type InputVariant, inputClassName } from './inputVariants'

export type InputProps = React.ComponentPropsWithRef<typeof TextInput> & {
  variant?: InputVariant
}

// World's Input on React Native TextInput. Figtree, `text-foreground`, a
// `muted-foreground` placeholder and the Dynamic Type cap by default.
export const Input = ({ variant, className, ...props }: InputProps) => (
  <TextInput
    maxFontSizeMultiplier={getMaxFontSizeMultiplier()}
    placeholderTextColorClassName="accent-muted-foreground"
    {...props}
    className={inputClassName(variant, className)}
  />
)
