import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React from 'react'
import { PositionCard } from './PositionCard'

interface IPositionsListProps extends BoxProps<Theme> {
  positions?: string[]
}

export const PositionsList = ({
  positions,
  ...boxProps
}: IPositionsListProps) => {
  return (
    <Box {...boxProps} flex={1}>
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        paddingVertical="m"
      >
        <Text variant="body3" color="secondaryText">
          Positions
        </Text>
      </Box>
      {positions?.map((p, idx) => (
        <PositionCard
          // eslint-disable-next-line react/no-array-index-key
          key={`proposal-${idx}`}
          position={p}
          marginTop={idx > 0 ? 'm' : undefined}
        />
      ))}
    </Box>
  )
}
