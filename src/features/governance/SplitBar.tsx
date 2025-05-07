import Box from '@components/Box'
import Text from '@components/Text'
import { Theme } from '@theme/theme'
import React from 'react'

type SplitBarProps = {
  title: string
  leftValue: string
  rightValue: string
  leftPercentage: number
  rightPercentage: number
  leftColor?: keyof Theme['colors']
  rightColor?: keyof Theme['colors']
  leftLabel?: string
  rightLabel?: string
}

export const SplitBar = ({
  title,
  leftValue,
  rightValue,
  leftPercentage,
  rightPercentage,
  leftColor = 'iotGreen',
  rightColor = 'mobileBlue',
  leftLabel = 'IOT',
  rightLabel = 'Mobile',
}: SplitBarProps) => {
  return (
    <Box>
      <Text variant="body2" color="secondaryText" marginBottom="s">
        {title}
      </Text>
      <Box
        flexDirection="row"
        alignItems="center"
        marginBottom="xxs"
        width="100%"
        backgroundColor="black900"
        borderRadius="round"
        overflow="hidden"
      >
        <Box
          height={10}
          backgroundColor={leftColor}
          width={`${leftPercentage}%`}
        />
        <Box
          height={10}
          backgroundColor={rightColor}
          width={`${rightPercentage}%`}
        />
      </Box>
      <Box flexDirection="row" justifyContent="space-between">
        <Text variant="body3" color={leftColor}>
          {leftLabel}: {leftValue}
        </Text>
        <Text variant="body3" color={rightColor}>
          {rightLabel}: {rightValue}
        </Text>
      </Box>
    </Box>
  )
}
