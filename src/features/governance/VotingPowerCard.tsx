import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import { Zap } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { withUniwind } from 'uniwind'

const ZapIcon = withUniwind(Zap)

interface IVotingPowerCardProps {
  onPress?: (mint: PublicKey) => Promise<void>
  className?: string
}

export const VotingPowerCardSkeleton = ({
  className,
}: {
  className?: string
}) => {
  const { t } = useTranslation()
  const { mint } = useGovernance()
  const { symbol } = useMetaplexMetadata(mint)

  return (
    <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
      <View
        className={twMerge(
          'flex-row justify-between rounded-[12px] bg-secondary p-4',
          className,
        )}
      >
        <View className="flex-1">
          <Text size="base" className="text-muted-foreground">
            {t('gov.votingPower.title')}
          </Text>
          <View className="mt-1 h-4 w-[70px] bg-card" />
        </View>
        <View className="flex-1 items-end">
          <Text size="base" className="text-right text-muted-foreground">
            {t('gov.votingPower.locked', { symbol })}
          </Text>
          <View className="mt-1 h-4 w-[70px] bg-card" />
        </View>
      </View>
      <View className="flex-1 border-t-2 border-background p-4">
        <View className="h-4 w-80 bg-card" />
      </View>
    </Animated.View>
  )
}

export const VotingPowerCard = ({
  onPress,
  className,
}: IVotingPowerCardProps) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const {
    loading,
    mint,
    votingPower,
    myVotingPower,
    proxiedVotingPower,
    amountLocked,
  } = useGovernance()
  const { info: mintAcc } = useMint(mint)
  const { amount: ownedAmount } = useOwnedAmount(wallet, mint)
  const { symbol } = useMetaplexMetadata(mint)

  const handleOnPress = async () => {
    if (onPress) await onPress(mint)
  }

  const noVotingPower = !loading && (!votingPower || votingPower.isZero())
  const hasProxiedVotingPower =
    !loading && proxiedVotingPower && !proxiedVotingPower.isZero()

  const renderCard = (compact = false) => {
    if (loading) return <VotingPowerCardSkeleton />

    return (
      <>
        <View className="p-4">
          {!compact && (
            <View className="mb-4 flex-row justify-between">
              <Text size="xl" className="font-medium">
                {t('gov.votingPower.yourPower')}
              </Text>
              <Text size="xl" className="font-medium">
                &gt;
              </Text>
            </View>
          )}
          {!compact && noVotingPower && (
            <View className="flex-row items-center">
              <Text size="base">{t('gov.votingPower.noPower')}</Text>
            </View>
          )}
          {((!compact && !noVotingPower) || compact) && (
            <View className="flex-col items-stretch justify-center gap-1">
              {hasProxiedVotingPower && (
                <View className="flex-row justify-between">
                  <Text size="base" className="text-muted-foreground">
                    {t('gov.votingPower.proxiedPower')}
                  </Text>
                  <View className="flex-row items-center">
                    <Text size="base">
                      {mintAcc &&
                        humanReadable(
                          proxiedVotingPower || new BN(0),
                          mintAcc.decimals,
                        )}
                    </Text>
                  </View>
                </View>
              )}
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text size="base" className="text-muted-foreground">
                    {t('gov.votingPower.title')}
                  </Text>
                  <View className="flex-row items-center">
                    <Text size="base">
                      {mintAcc &&
                        humanReadable(
                          myVotingPower || new BN(0),
                          mintAcc.decimals,
                        )}
                    </Text>
                    {amountLocked &&
                      myVotingPower &&
                      !amountLocked.isZero() &&
                      !myVotingPower.isZero() && (
                        <View className="flex-row items-center justify-center rounded-md px-2">
                          <ZapIcon
                            size={20}
                            colorClassName="accent-blue-dark-500"
                          />
                          <Text size="xs">
                            {`${
                              myVotingPower &&
                              amountLocked &&
                              mintAcc &&
                              // Add 2 decimals to the mulitiplier
                              humanReadable(
                                myVotingPower
                                  .mul(new BN(100))
                                  .div(amountLocked),
                                2,
                              )
                            }x`}
                          </Text>
                        </View>
                      )}
                  </View>
                </View>
                <View className="flex-1">
                  <Text
                    size="base"
                    className="text-right text-muted-foreground"
                  >
                    {t('gov.votingPower.locked', { symbol })}
                  </Text>
                  <Text size="base" className="text-right">
                    {mintAcc &&
                      humanReadable(
                        amountLocked || new BN(0),
                        mintAcc.decimals,
                      )}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        <View className="border-t-2 border-background px-4 py-3">
          <Text className="text-muted-foreground">
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
        </View>
      </>
    )
  }

  if (onPress)
    return (
      <Animated.View
        entering={FADE_IN}
        exiting={FADE_OUT}
        className={twMerge('rounded-[12px] bg-secondary', className)}
      >
        <PressableScale
          feedback="opacity"
          onPress={() => void handleOnPress().catch(console.error)}
        >
          {renderCard(false)}
        </PressableScale>
      </Animated.View>
    )

  return (
    <View className={twMerge('rounded-[12px] bg-secondary', className)}>
      {renderCard(true)}
    </View>
  )
}
