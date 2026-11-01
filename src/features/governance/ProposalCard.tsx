import { useMint } from '@helium/helium-react-hooks'
import {
  useProposalConfig,
  useResolutionSettings,
} from '@helium/modular-governance-hooks'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { humanReadable } from '@utils/formatting'
import axios from 'axios'
import BN from 'bn.js'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { getTimeFromNowFmt } from '@utils/dateTools'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import useNowAfter from '@hooks/useNowAfter'
import { getDerivedProposalState } from '@utils/governanceUtils'
import { ProposalFilter, ProposalV0 } from './governanceTypes'
import { ProposalTags } from './ProposalTags'
import { proposalSummary } from './proposalMarkdown'

interface IProposalCardProps {
  filter: ProposalFilter
  proposal: ProposalV0
  proposalKey: PublicKey
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

export const ProposalCard = ({
  proposal,
  proposalKey,
  onPress,
  className,
}: IProposalCardProps) => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const { mint } = useGovernance()
  const { proposalConfig: proposalConfigKey } = proposal
  const decimals = useMint(mint)?.info?.decimals
  const { info: proposalConfig } = useProposalConfig(proposalConfigKey)
  const { info: resolution } = useResolutionSettings(
    proposalConfig?.stateController,
  )

  const derivedState = getDerivedProposalState(proposal)

  const proposalIdsSeenByMint = currentAccount?.proposalIdsSeenByMint
  const hasSeen = proposalIdsSeenByMint
    ? proposalIdsSeenByMint[mint.toBase58()]?.includes(proposalKey.toBase58())
    : undefined

  const endTs =
    resolution &&
    (proposal?.state.resolved
      ? proposal?.state.resolved.endTs
      : proposal?.state.voting?.startTs.add(
          resolution.settings.nodes.find(
            (node) => typeof node.offsetFromStartTs !== 'undefined',
          )?.offsetFromStartTs?.offset ?? new BN(0),
        ))

  const proposalUri = proposal?.uri
  const { isLoading: descLoading, data: desc } = useQuery({
    queryKey: ['proposalDescription', proposalUri],
    queryFn: async () => {
      if (proposalUri) {
        // Force HTTPS for security - convert any HTTP URLs to HTTPS
        const secureUri = proposalUri.replace(/^http:\/\//, 'https://')
        const { data } = await axios.get(secureUri)
        return proposalSummary(data)
      }
      return null
    },
  })

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
