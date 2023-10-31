import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React from 'react'

interface IProposalCardProps extends BoxProps<Theme> {
  proposal: string
}

export const ProposalCard = ({ proposal, ...boxProps }: IProposalCardProps) => {
  return (
    <Box backgroundColor="surfaceSecondary" borderRadius="l" {...boxProps}>
      <Box padding="m">
        <Box
          flexDirection="row"
          justifyContent="space-between"
          marginBottom="m"
        >
          <Text variant="subtitle1" color="primaryText" fontSize={16}>
            {`Proposal ${proposal}`}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
