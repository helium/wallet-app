import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { Theme } from '@theme/theme'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useCallback } from 'react'

interface IVotingPowerCardProps extends BoxProps<Theme> {
  onPress?: (mint: PublicKey) => Promise<void>
}

export const VotingPowerCard = ({
  onPress,
  ...boxProps
}: IVotingPowerCardProps) => {
  const wallet = useCurrentWallet()
  const { mint, votingPower, amountLocked } = useGovernance()
  const { amount: ownedAmount, decimals } = useOwnedAmount(wallet, mint)
  const { symbol } = useMetaplexMetadata(mint)

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
            <Text variant="subtitle1" color="primaryText">
              Your Voting Power
            </Text>
            {onPress && (
              <Text variant="subtitle1" color="primaryText">
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
              {humanReadable(votingPower, decimals)}
            </Text>
          </Box>
          {inOverview ? (
            <Box>
              <Text variant="body1" color="secondaryText" textAlign="right">
                {`${symbol || ''}`} Locked
              </Text>
              <Text variant="body1" color="primaryText" textAlign="right">
                {humanReadable(amountLocked, decimals)}
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
                {humanReadable(amountLocked, decimals)}
              </Text>
            </Box>
            <Box>
              <Text variant="body1" color="secondaryText" textAlign="right">
                HNT Available
              </Text>
              <Text variant="body1" color="primaryText" textAlign="right">
                {humanReadable(new BN(ownedAmount?.toString() || 0), decimals)}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
      {inOverview && (
        <Box borderTopColor="primaryBackground" borderTopWidth={2} padding="ms">
          <Text variant="body2" color="secondaryText">
            You have{' '}
            {humanReadable(new BN(ownedAmount?.toString() || 0), decimals)} more{' '}
            {symbol} available to lock.
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
