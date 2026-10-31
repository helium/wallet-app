import { Text } from '@ui/Text'
import React from 'react'
import { View } from 'react-native'

export type SplitBarColor = 'hnt' | 'mobile' | 'iot'

// Literal class names, so Tailwind finds them.
const barClassNames: Record<SplitBarColor, string> = {
  hnt: 'bg-hnt',
  mobile: 'bg-mobile',
  iot: 'bg-iot',
}
const textClassNames: Record<SplitBarColor, string> = {
  hnt: 'text-hnt',
  mobile: 'text-mobile',
  iot: 'text-iot',
}

type SplitBarProps = {
  title: string
  leftValue: string
  rightValue: string
  leftPercentage: number
  rightPercentage: number
  leftColor?: SplitBarColor
  rightColor?: SplitBarColor
  leftLabel?: string
  rightLabel?: string
}

export const SplitBar = ({
  title,
  leftValue,
  rightValue,
  leftPercentage,
  rightPercentage,
  leftColor = 'iot',
  rightColor = 'mobile',
  leftLabel = 'IOT',
  rightLabel = 'Mobile',
}: SplitBarProps) => {
  return (
    <View>
      <Text className="mb-2 text-muted-foreground">{title}</Text>
      <View className="mb-0.5 w-full flex-row items-center overflow-hidden rounded-full bg-muted">
        <View
          className={`h-2.5 ${barClassNames[leftColor]}`}
          style={{ width: `${leftPercentage}%` }}
        />
        <View
          className={`h-2.5 ${barClassNames[rightColor]}`}
          style={{ width: `${rightPercentage}%` }}
        />
      </View>
      <View className="flex-row justify-between">
        <Text size="xs" className={textClassNames[leftColor]}>
          {leftLabel}: {leftValue}
        </Text>
        <Text size="xs" className={textClassNames[rightColor]}>
          {rightLabel}: {rightValue}
        </Text>
      </View>
    </View>
  )
}
