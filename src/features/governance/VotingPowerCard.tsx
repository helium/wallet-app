import LightningBolt from '@assets/images/transactions.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { useGovernance } from '@storage/GovernanceProvider'
import { Theme } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useCallback } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'

interface IVotingPowerCardProps extends BoxProps<Theme> {
  onPress?: () => void
}

export const VotingPowerCard = ({
  onPress,
  ...boxProps
}: IVotingPowerCardProps) => {
  const wallet = useCurrentWallet()
  const colors = useColors()
  const { mint, votingPower, amountLocked } = useGovernance()
  const { info: mintAcc } = useMint(mint)
  const { amount: ownedAmount } = useOwnedAmount(wallet, mint)
  const { symbol } = useMetaplexMetadata(mint)

  const handleOnPress = useCallback(async () => {
    if (onPress) await onPress()
  }, [onPress])

  // todo (gov): Add no voting power placeholder
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
          <Box flex={1}>
            <Text variant="body1" color="secondaryText">
              Voting Power
            </Text>
            <Box flexDirection="row" alignItems="center">
              <Text variant="body1" color="primaryText">
                {mintAcc &&
                  votingPower &&
                  humanReadable(votingPower, mintAcc.decimals)}{' '}
              </Text>
              {amountLocked &&
                votingPower &&
                !amountLocked.isZero() &&
                !votingPower.isZero() && (
                  <Box
                    flexDirection="row"
                    justifyContent="center"
                    alignItems="center"
                    borderRadius="m"
                    paddingHorizontal="s"
                    paddingLeft="s"
                  >
                    <LightningBolt
                      color={colors.blueBright500}
                      width={20}
                      height={20}
                    />
                    <Text variant="body3" color="primaryText">
                      {`${
                        votingPower &&
                        amountLocked &&
                        mintAcc &&
                        // Add 2 decimals to the mulitiplier
                        humanReadable(
                          votingPower.mul(new BN(100)).div(amountLocked),
                          2,
                        )
                      }x`}
                    </Text>
                  </Box>
                )}
            </Box>
          </Box>
          {inOverview ? (
            <Box flex={1}>
              <Text variant="body1" color="secondaryText" textAlign="right">
                {`${symbol || ''}`} Locked
              </Text>
              <Text variant="body1" color="primaryText" textAlign="right">
                {mintAcc &&
                  amountLocked &&
                  humanReadable(amountLocked, mintAcc.decimals)}
              </Text>
            </Box>
          ) : (
            <Box flex={1}>
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
          <Box
            flex={1}
            flexDirection="row"
            justifyContent="space-between"
            marginTop="m"
          >
            <Box>
              <Text variant="body1" color="secondaryText">
                {`${symbol || ''}`} Locked
              </Text>
              <Text variant="body1" color="primaryText">
                {mintAcc &&
                  amountLocked &&
                  humanReadable(amountLocked, mintAcc.decimals)}
              </Text>
            </Box>
            <Box>
              <Text variant="body1" color="secondaryText" textAlign="right">
                {symbol} Available
              </Text>
              <Text variant="body1" color="primaryText" textAlign="right">
                {mintAcc &&
                  ownedAmount &&
                  humanReadable(
                    new BN(ownedAmount?.toString()),
                    mintAcc.decimals,
                  )}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
      {inOverview && (
        <Box
          flex={1}
          borderTopColor="primaryBackground"
          borderTopWidth={2}
          padding="ms"
        >
          <Text variant="body2" color="secondaryText">
            You have{' '}
            {mintAcc &&
              ownedAmount &&
              humanReadable(
                new BN(ownedAmount?.toString()),
                mintAcc.decimals,
              )}{' '}
            more {symbol} available to lock.
          </Text>
        </Box>
      )}
    </>
  )

  if (onPress)
    return (
      <ReAnimatedBox
        backgroundColor="secondaryBackground"
        borderRadius="l"
        entering={FadeIn}
        exiting={FadeOut}
        {...boxProps}
      >
        <TouchableOpacityBox onPress={handleOnPress}>
          {renderCard(true)}
        </TouchableOpacityBox>
      </ReAnimatedBox>
    )

  return (
    <ReAnimatedBox
      backgroundColor="secondaryBackground"
      borderRadius="l"
      {...boxProps}
    >
      {renderCard(false)}
    </ReAnimatedBox>
  )
}
