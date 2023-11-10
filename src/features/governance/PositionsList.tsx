import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React from 'react'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { PositionCard } from './PositionCard'

interface IPositionsListProps extends BoxProps<Theme> {
  positions?: PositionWithMeta[]
}

export const PositionsList = ({
  positions = [],
  ...boxProps
}: IPositionsListProps) => {
  return (
    <Box {...boxProps} flex={1}>
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        paddingVertical="l"
      >
        <Text variant="body3" color="secondaryText">
          Positions
        </Text>
      </Box>
      {!positions.length && (
        <Box
          backgroundColor="secondaryBackground"
          alignItems="center"
          borderRadius="l"
          padding="m"
          {...boxProps}
        >
          <Text variant="body1" color="secondaryText">
            Increase your voting power by locking tokens
          </Text>
        </Box>
      )}
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
