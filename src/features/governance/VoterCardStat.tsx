import Box from '@components/Box'
import Text from '@components/Text'
import React from 'react'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'

export const VoterCardStat: React.FC<
  {
    title: string
    value: string
  } & BoxProps<Theme>
> = ({ title, value, ...boxProps }) => {
  return (
    <Box flexDirection="column" {...boxProps}>
      <Text variant="body3" color="white" opacity={0.5}>
        {title}
      </Text>
      <Text variant="body1" color="white">
        {value}
      </Text>
    </Box>
  )
}
