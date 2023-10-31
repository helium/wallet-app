import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React from 'react'

interface IPositionCardProps extends Omit<BoxProps<Theme>, 'position'> {
  position: string
}

export const PositionCard = ({ position, ...boxProps }: IPositionCardProps) => {
  return (
    <Box backgroundColor="surfaceSecondary" borderRadius="l" {...boxProps}>
      <Box padding="m">
        <Box
          flexDirection="row"
          justifyContent="space-between"
          marginBottom="m"
        >
          <Text variant="subtitle1" color="primaryText" fontSize={16}>
            {`Position ${position}`}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
