import LightningBolt from '@assets/images/transactions.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { Theme } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'

interface IVotingPowerCardProps extends BoxProps<Theme> {
  onPress?: (mint: PublicKey) => Promise<void>
}

export const VotingPowerCardSkeleton = (boxProps: BoxProps<Theme>) => {
  const { t } = useTranslation()
  const { mint } = useGovernance()
  const { symbol } = useMetaplexMetadata(mint)

  return (
    <FadeInOut>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        padding="m"
        {...boxProps}
      >
        <Box flex={1}>
          <Text variant="body1" color="secondaryText">
            {t('gov.votingPower.title')}
          </Text>
          <Box
            width={70}
            height={16}
            marginTop="xs"
            backgroundColor="surface"
          />
        </Box>
        <Box flex={1} alignItems="flex-end">
          <Text variant="body1" color="secondaryText" textAlign="right">
            {t('gov.votingPower.locked', { symbol })}
          </Text>
          <Box
            width={70}
            height={16}
            marginTop="xs"
            backgroundColor="surface"
          />
        </Box>
      </Box>
      <Box
        flex={1}
        borderTopColor="primaryBackground"
        borderTopWidth={2}
        paddingVertical="m"
        paddingHorizontal="m"
      >
        <Box width={320} height={16} backgroundColor="surface" />
      </Box>
    </FadeInOut>
  )
}

export const VotingPowerCard = ({
  onPress,
  ...boxProps
}: IVotingPowerCardProps) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const colors = useColors()
  const { loading, mint, votingPower, amountLocked } = useGovernance()
  const { info: mintAcc } = useMint(mint)
  const { amount: ownedAmount } = useOwnedAmount(wallet, mint)
  const { symbol } = useMetaplexMetadata(mint)

  const handleOnPress = useCallback(async () => {
    if (onPress) await onPress(mint)
  }, [onPress, mint])

  const noVotingPower = !loading && (!amountLocked || amountLocked.isZero())
  const renderCard = (compact = false) => {
    if (loading) return <VotingPowerCardSkeleton />

    return (
      <>
        <Box padding="m">
          {!compact && (
            <Box
              flexDirection="row"
              justifyContent="space-between"
              marginBottom="m"
            >
              <Text variant="subtitle1" color="primaryText">
                {t('gov.votingPower.yourPower')}
              </Text>
              <Text variant="subtitle1" color="primaryText">
                &gt;
              </Text>
            </Box>
          )}
          {!compact && noVotingPower && (
            <Box flexDirection="row" alignItems="center">
              <Text variant="body1" color="primaryText">
                {t('gov.votingPower.noPower')}
              </Text>
            </Box>
          )}
          {((!compact && !noVotingPower) || compact) && (
            <>
              <Box flexDirection="row" justifyContent="space-between">
                <Box flex={1}>
                  <Text variant="body1" color="secondaryText">
                    {t('gov.votingPower.title')}
                  </Text>
                  <Box flexDirection="row" alignItems="center">
                    <Text variant="body1" color="primaryText">
                      {mintAcc &&
                        humanReadable(
                          votingPower || new BN(0),
                          mintAcc.decimals,
                        )}
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
                <Box flex={1}>
                  <Text variant="body1" color="secondaryText" textAlign="right">
                    {t('gov.votingPower.locked', { symbol })}
                  </Text>
                  <Text variant="body1" color="primaryText" textAlign="right">
                    {mintAcc &&
                      humanReadable(
                        amountLocked || new BN(0),
                        mintAcc.decimals,
                      )}
                  </Text>
                </Box>
              </Box>
            </>
          )}
        </Box>
        <Box
          flex={1}
          borderTopColor="primaryBackground"
          borderTopWidth={2}
          paddingVertical="ms"
          paddingHorizontal="m"
        >
          <Text variant="body2" color="secondaryText">
            {t('gov.votingPower.youHave', {
              amount:
                mintAcc &&
                humanReadable(
                  new BN(ownedAmount?.toString() || 0),
                  mintAcc.decimals,
                ),
              symbol,
            })}
          </Text>
        </Box>
      </>
    )
  }

  if (onPress)
    return (
      <ReAnimatedBox
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        entering={FadeIn}
        exiting={FadeOut}
        {...boxProps}
      >
        <TouchableOpacityBox onPress={handleOnPress}>
          {renderCard(false)}
        </TouchableOpacityBox>
      </ReAnimatedBox>
    )

  return (
    <ReAnimatedBox
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      {...boxProps}
    >
      {renderCard(true)}
    </ReAnimatedBox>
  )
}
