import React from 'react'
import { View } from 'react-native'
import { twMerge } from './twMerge'

export type DotColor = 'purple' | 'success'

const dotColors: Record<DotColor, string> = {
  purple: 'border-purple-500 bg-purple-500',
  success: 'border-success-500 bg-success-500',
}

export type DotProps = { filled?: boolean; color?: DotColor; size?: number }

// A round status dot: filled in its colour, or an empty muted ring.
export const Dot = ({ filled, color = 'purple', size = 16 }: DotProps) => (
  <View
    style={{ width: size, height: size }}
    className={twMerge(
      'mx-1 rounded-full border border-muted-foreground',
      filled && dotColors[color],
    )}
  />
)
