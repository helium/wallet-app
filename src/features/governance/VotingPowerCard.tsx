import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import React, { useCallback } from 'react'

interface IVotingPowerCardProps extends BoxProps<Theme> {
  mint: PublicKey
  onPress?: (mint: PublicKey) => Promise<void>
}

export const VotingPowerCard = ({
  mint,
  onPress,
  ...boxProps
}: IVotingPowerCardProps) => {
  const handleOnPress = useCallback(async () => {
    if (onPress) await onPress(mint)
  }, [mint, onPress])

  const renderCard = (inOverview = false) => (
    <>
      <Box padding="m">
        {inOverview && (
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginBottom="m"
          >
            <Text
              variant="subtitle1"
              color="primaryText"
              fontSize={20}
              lineHeight={23}
            >
              Your Voting Power
            </Text>
            {onPress && (
              <Text
                variant="subtitle1"
                color="primaryText"
                fontSize={20}
                lineHeight={23}
              >
                &gt;
              </Text>
            )}
          </Box>
        )}
        <Box flexDirection="row" justifyContent="space-between">
          <Box>
            <Text variant="body1" color="secondaryText">
              Voting Power
            </Text>
            <Text variant="body1" color="primaryText">
              6,768,492.53
            </Text>
          </Box>
          {inOverview ? (
            <Box>
              <Text variant="body1" color="secondaryText" textAlign="right">
                HNT Locked
              </Text>
              <Text variant="body1" color="primaryText" textAlign="right">
                540,000
              </Text>
            </Box>
          ) : (
            <Box>
              <Text variant="body1" color="secondaryText" textAlign="right">
                Active Votes
              </Text>
              <Text variant="body1" color="primaryText" textAlign="right">
                2
              </Text>
            </Box>
          )}
        </Box>
        {!inOverview && (
          <Box flexDirection="row" justifyContent="space-between" marginTop="m">
            <Box>
              <Text variant="body1" color="secondaryText">
                HNT Locked
              </Text>
              <Text variant="body1" color="primaryText">
                540,000
              </Text>
            </Box>
            <Box>
              <Text variant="body1" color="secondaryText" textAlign="right">
                HNT Available
              </Text>
              <Text variant="body1" color="primaryText" textAlign="right">
                497.48730345
              </Text>
            </Box>
          </Box>
        )}
      </Box>
      {inOverview && (
        <Box borderTopColor="primaryBackground" borderTopWidth={2} padding="ms">
          <Text variant="body3" color="secondaryText">
            You have 497.48730345 more HNT available to lock.
          </Text>
        </Box>
      )}
    </>
  )

  return onPress ? (
    <TouchableOpacityBox
      backgroundColor="secondaryBackground"
      borderRadius="l"
      onPress={handleOnPress}
      {...boxProps}
    >
      {renderCard(true)}
    </TouchableOpacityBox>
  ) : (
    <Box backgroundColor="secondaryBackground" borderRadius="l" {...boxProps}>
      {renderCard(false)}
    </Box>
  )
}
