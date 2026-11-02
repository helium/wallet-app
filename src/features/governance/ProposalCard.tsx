import { PublicKey } from '@solana/web3.js'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { getTimeFromNowFmt } from '@utils/dateTools'
import useNowAfter from '@hooks/useNowAfter'
import { getDerivedProposalState } from '@utils/governanceUtils'
import { ProposalFilter, ProposalV0 } from './governanceTypes'
import { ProposalTags } from './ProposalTags'

interface IProposalCardProps {
  filter: ProposalFilter
  proposal: ProposalV0
  proposalKey: PublicKey
  mint: PublicKey
  decimals?: number
  hasSeen?: boolean
  endTs?: BN
  desc?: string | null
  descLoading: boolean
  onPress?: (mint: PublicKey, proposal: PublicKey) => Promise<void>
  className?: string
}

const StatusChip = ({
  dotClassName,
  label,
}: {
  dotClassName: string
  label: string
}) => (
  <View className="mb-2 mr-2">
    <View className="flex-row items-center rounded-md bg-background p-2">
      <View className={twMerge('z-[2] size-2.5 rounded-full', dotClassName)} />
      <Text className="ml-2 text-[10px] text-muted-foreground">{label}</Text>
    </View>
  </View>
)

// A list row. The list fetches the mint, the vote end and the description
// once for all rows; the row only renders them.
export const ProposalCard = ({
  proposal,
  proposalKey,
  mint,
  decimals,
  hasSeen,
  endTs,
  desc,
  descLoading,
  onPress,
  className,
}: IProposalCardProps) => {
  const { t } = useTranslation()
  const derivedState = getDerivedProposalState(proposal)

  const totalVotes: BN = [...(proposal?.choices || [])].reduce(
    (acc, { weight }) => weight.add(acc) as BN,
    new BN(0),
  )

  const now = useNowAfter(endTs?.toNumber())
  const completed = endTs && endTs.toNumber() <= now / 1000
  const isLoading = descLoading
  const handleOnPress = async () => {
    if (onPress) await onPress(mint, proposalKey)
  }

  if (isLoading) return null
  return (
    <Animated.View
      className={twMerge('relative rounded-[12px] bg-secondary', className)}
      entering={FADE_IN}
      exiting={FADE_OUT}
    >
      <PressableScale
        feedback="opacity"
        onPress={() => void handleOnPress().catch(console.error)}
      >
        <View
          className={twMerge(
            'relative p-4 pt-3',
            derivedState === 'active' ? 'pb-4' : 'pb-2',
          )}
        >
          <View className="flex-row flex-wrap">
            {!hasSeen && derivedState === 'active' && !completed && (
              <StatusChip dotClassName="bg-warning-500" label="UNSEEN" />
            )}
            {hasSeen && derivedState === 'active' && !completed && (
              <StatusChip dotClassName="bg-blue-dark-500" label="ACTIVE" />
            )}
            <ProposalTags tags={proposal?.tags} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text size="base" className="shrink font-medium">
              {proposal?.name}
            </Text>
          </View>
          {derivedState === 'active' && (
            <Text className="mt-1 text-muted-foreground" numberOfLines={2}>
              {desc || t('gov.proposals.noDescription')}
            </Text>
          )}
        </View>
        {/* TODO (gov): add back once we can derive what they voted easily */}
        {/*         {derivedState === 'active' && (
          <View className="border-y-2 border-background px-4 py-2">
            <Text className="text-muted-foreground">You Voted - Yes</Text>
          </View>
        )} */}
        <View
          /* TODO (gov): add back once we can derive what they voted easily */
          /* pt-4 when derivedState === 'active' */
          className="px-4 pb-3"
        >
          <View className="flex-row justify-between">
            <View>
              {derivedState === 'active' && !completed && (
                <Text className="text-muted-foreground">
                  {t('gov.proposals.estTime')}
                </Text>
              )}
              {derivedState === 'active' && completed && (
                <Text className="text-muted-foreground">
                  {t('gov.proposals.votingClosed')}
                </Text>
              )}
              {derivedState === 'passed' && (
                <Text className="text-success-500">
                  {t('gov.proposals.success')}
                </Text>
              )}
              {derivedState === 'completed' && (
                <Text className="text-success-500">
                  {t('gov.proposals.completed')}
                </Text>
              )}
              {derivedState === 'failed' && (
                <Text className="text-destructive">
                  {t('gov.proposals.failed')}
                </Text>
              )}
              {derivedState === 'cancelled' && (
                <Text className="text-warning-500">
                  {t('gov.proposals.cancelled')}
                </Text>
              )}
              {derivedState !== 'cancelled' && (
                <Text>{getTimeFromNowFmt(endTs || new BN(0))}</Text>
              )}
            </View>
            {derivedState !== 'cancelled' && (
              <View>
                <Text className="text-right text-muted-foreground">
                  {t('gov.proposals.votes')}
                </Text>
                <Text className="text-right">
                  {humanReadable(totalVotes, decimals) || 'None'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  )
}
