import { getMaxFontSizeMultiplier } from '@utils/layout'
import React from 'react'
import { Text as RNText, type TextProps as RNTextProps } from 'react-native'
import { type TextSize, textVariants } from './textVariants'

export type TextProps = RNTextProps & {
  size?: TextSize
}

// Figtree, `text-foreground` and the Dynamic Type cap by default. Classes in
// `className` come after the variant classes, so they win.
export const Text = ({ size, className, ...props }: TextProps) => (
  <RNText
    maxFontSizeMultiplier={getMaxFontSizeMultiplier()}
    {...props}
    className={`${textVariants({ size })} ${className ?? ''}`}
  />
)
