import { getMaxFontSizeMultiplier } from '@utils/layout'
import React from 'react'
import { Text as RNText, type TextProps as RNTextProps } from 'react-native'
import { type TextSize, textClassName } from './textVariants'

export type TextProps = RNTextProps & {
  size?: TextSize
}

// Figtree, `text-foreground` and the Dynamic Type cap by default. Uniwind picks
// between conflicting classes by CSS order, not by their order in the string,
// so twMerge drops a default that `className` overrides.
export const Text = ({ size, className, ...props }: TextProps) => (
  <RNText
    maxFontSizeMultiplier={getMaxFontSizeMultiplier()}
    {...props}
    className={textClassName(size, className)}
  />
)
