import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import React, { useCallback } from 'react'

interface IProposalCardProps extends BoxProps<Theme> {
  proposal: PublicKey
  onPress?: (proposal: PublicKey) => Promise<void>
}

export const ProposalCard = ({
  proposal,
  onPress,
  ...boxProps
}: IProposalCardProps) => {
  const handleOnPress = useCallback(async () => {
    if (onPress) await onPress(proposal)
  }, [proposal, onPress])

  return (
    <TouchableOpacityBox
      backgroundColor="secondaryBackground"
      borderRadius="l"
      onPress={handleOnPress}
      {...boxProps}
    >
      <Box padding="m" paddingTop="s">
        <Box
          flexDirection="row"
          justifyContent="flex-end"
          alignItems="center"
          paddingBottom="xs"
        >
          <Box padding="s" backgroundColor="surfaceSecondary" borderRadius="m">
            <Text variant="body3" color="secondaryText">
              HIP 42
            </Text>
          </Box>
        </Box>
        <Box flexShrink={1} paddingBottom="s">
          <Text variant="subtitle3" color="primaryText">
            {proposal.toBase58()}
          </Text>
        </Box>
        <Text variant="body2" color="surfaceSecondaryText" numberOfLines={2}>
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
    </TouchableOpacityBox>
  )
}
