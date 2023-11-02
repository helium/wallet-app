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
    <Box backgroundColor="secondaryBackground" borderRadius="l" {...boxProps}>
      <Box padding="m">
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text variant="subtitle1" color="primaryText" fontSize={16}>
            {`Proposal ${proposal}`}
          </Text>
          <Box padding="s" backgroundColor="surfaceSecondary" borderRadius="m">
            <Text variant="body3" color="secondaryText">
              HIP 42
            </Text>
          </Box>
        </Box>
        <Text variant="body2" color="surfaceSecondaryText">
          This proposal seeks to regulate the number of witnesses a Hotspot is
          rewarded for ultra long text that should be truncated
        </Text>
      </Box>
      <Box
        borderTopColor="primaryBackground"
        borderTopWidth={2}
        borderBottomColor="primaryBackground"
        borderBottomWidth={2}
        paddingHorizontal="m"
        paddingVertical="s"
      >
        <Text variant="body2" color="secondaryText">
          You Voted - Yes
        </Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" padding="m">
        <Box>
          <Text variant="body2" color="secondaryText">
            Est. Time Remaining
          </Text>
          <Text variant="body2" color="primaryText">
            4 days 20 minutes 50 seconds
          </Text>
        </Box>
        <Box>
          <Text variant="body2" color="secondaryText" textAlign="right">
            Votes
          </Text>
          <Text variant="body2" color="primaryText" textAlign="right">
            8,614
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
