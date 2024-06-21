import Box from '@components/Box'
import Text from '@components/Text'
import React from 'react'

export const VoterCardStat: React.FC<{ title: string; value: string }> = ({
  title,
  value,
}) => {
  return (
    <Box flexDirection="column">
      <Text variant="body3" color="white" opacity={0.5}>
        {title}
      </Text>
      <Text variant="body1" color="white">
        {value}
      </Text>
    </Box>
  )
}
