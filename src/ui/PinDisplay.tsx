import React from 'react'
import { View } from 'react-native'
import { twMerge } from './twMerge'

export const PIN_LENGTH = 6

export type PinDisplayProps = { length: number; className?: string }

// One dot per PIN digit; the first `length` dots fill.
export const PinDisplay = ({ length, className }: PinDisplayProps) => (
  <View className={twMerge('flex-row', className)}>
    {[...Array(PIN_LENGTH).keys()].map((i) => (
      <View
        key={i}
        testID={length > i ? 'PinDisplay.Filled' : 'PinDisplay.Empty'}
        className={twMerge(
          'mx-1 size-4 rounded-full border border-muted-foreground',
          length > i && 'border-purple-500 bg-purple-500',
        )}
      />
    ))}
  </View>
)
