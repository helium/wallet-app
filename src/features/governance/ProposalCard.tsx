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
          justifyContent="space-between"
          paddingBottom="xs"
        >
          <Box flexShrink={1}>
            <Text variant="subtitle3" color="primaryText">
              Beacon/Witness Ratio this iasdf asdf asdf ewfasd fe afe f
            </Text>
          </Box>
          <Box flexDirection="row" marginLeft="s" alignItems="flex-start">
            <Box
              padding="s"
              backgroundColor="surfaceSecondary"
              borderRadius="m"
            >
              <Text variant="body3" color="secondaryText">
                HIP 42
              </Text>
            </Box>
          </Box>
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
      <Box paddingHorizontal="m" padding="m">
        <Box
          flexDirection="row"
          justifyContent="space-between"
          paddingBottom="s"
        >
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
        <Box
          flexDirection="row"
          flex={1}
          height={6}
          borderRadius="m"
          overflow="hidden"
        >
          <Box width="25%" backgroundColor="turquoise" />
          <Box width="25%" backgroundColor="orange500" />
          <Box width="25%" backgroundColor="purple500" />
          <Box width="25%" backgroundColor="purpleHeart" />
        </Box>
      </Box>
    </TouchableOpacityBox>
  )
}
