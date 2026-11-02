import { BackScreen } from '@ui/BackScreen'
import { useMint } from '@helium/helium-react-hooks'
import {
  useProposal,
  useProposalConfig,
  useResolutionSettings,
} from '@helium/modular-governance-hooks'
import {
  useRegistrar,
  useRelinquishVote,
  useVote,
} from '@helium/voter-stake-registry-hooks'
import {
  useVoteMutation,
  useRelinquishVoteMutation,
} from '@hooks/useGovernanceMutations'
import useNowAfter from '@hooks/useNowAfter'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useGovernance } from '@storage/GovernanceProvider'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { getTimeFromNowFmt } from '@utils/dateTools'
import { humanReadable } from '@utils/formatting'
import { getDerivedProposalState } from '@utils/governanceUtils'
import axios from 'axios'
import BN from 'bn.js'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { Markdown } from './Markdown'
import { VoteOption, votingResultColor } from './VoteOption'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
  ProposalV0,
  VoteChoiceWithMeta,
} from './governanceTypes'

const SafeArea = withUniwind(SafeAreaView)
const BrowseProxiesIcon = withUniwind(Users)

const safeEdges: Edge[] = ['bottom']
const backEdges: Edge[] = ['top']

type Route = RouteProp<GovernanceStackParamList, 'ProposalScreen'>
export const ProposalScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  // A deep link can carry any string as the proposal param.
  const proposalKey = useMemo(() => {
    try {
      return new PublicKey(route.params.proposal)
    } catch {
      return undefined
    }
  }, [route.params.proposal])

  if (!proposalKey) {
    return (
      <BackScreen title="Proposal Overview" edges={backEdges}>
        <Text className="text-destructive">
          {t('gov.errors.invalidProposal')}
        </Text>
      </BackScreen>
    )
  }

  return <ProposalOverview proposalKey={proposalKey} />
}

const ProposalOverview = ({ proposalKey }: { proposalKey: PublicKey }) => {
  const { t } = useTranslation()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const { upsertAccount, currentAccount } = useAccountStorage()
  const [currVote, setCurrVote] = useState(0)
  const {
    mint,
    loading,
    votingPower,
    positions,
    refetch: refetchState,
  } = useGovernance()
  const {
    submit: castVote,
    isPending: voteMutPending,
    error: voteError,
  } = useVoteMutation()
  const {
    submit: doRelinquish,
    isPending: relinquishMutPending,
    error: relinquishError,
  } = useRelinquishVoteMutation()
  const handleBrowseProxies = () => {
    navigation.navigate(
      'ProxiesScreen',
      { mint: mint.toBase58() },
      { pop: true },
    )
  }
  const { info: proposal } = useProposal(proposalKey)
  const { info: proposalConfig } = useProposalConfig(proposal?.proposalConfig)
  const { info: registrar } = useRegistrar(proposalConfig?.voteController)
  const decimals = useMint(registrar?.votingMints[0].mint)?.info?.decimals
  const { info: resolution } = useResolutionSettings(
    proposalConfig?.stateController,
  )

  const hasSeen = useMemo(() => {
    if (currentAccount?.proposalIdsSeenByMint) {
      return currentAccount.proposalIdsSeenByMint[mint.toBase58()]?.includes(
        proposalKey.toBase58(),
      )
    }
  }, [currentAccount, mint, proposalKey])

  useEffect(() => {
    const run = async () => {
      if (currentAccount?.address && !hasSeen && proposal && resolution) {
        const { proposalIdsSeenByMint = {} } = currentAccount
        await upsertAccount({
          ...currentAccount,
          proposalIdsSeenByMint: {
            ...proposalIdsSeenByMint,
            [mint.toBase58()]: [
              ...(proposalIdsSeenByMint[mint.toBase58()] || []),
              proposalKey.toBase58(),
            ],
          },
        })
      }
    }
    run().catch((e) => console.error(e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSeen])

  const { didVote, canVote, voters } = useVote(proposalKey)
  const { canRelinquishVote } = useRelinquishVote(proposalKey)

  const { error: markdownErr, data: markdown } = useQuery({
    queryKey: ['proposalMarkdown', proposal?.uri],
    queryFn: async () => {
      if (proposal && proposal.uri) {
        // Force HTTPS for security - convert any HTTP URLs to HTTPS
        const secureUri = proposal.uri.replace(/^http:\/\//, 'https://')
        const { data } = await axios.get(secureUri)
        return data
      }
      return null
    },
  })

  const transactionError = useMemo(() => {
    if (markdownErr && !markdown) {
      return markdownErr.message || t('gov.errors.markdown')
    }

    if (voteError) {
      return voteError.message || t('gov.errors.castVote')
    }

    if (relinquishError) {
      return relinquishError.message || t('gov.errors.relinquishVote')
    }

    return undefined
  }, [t, voteError, relinquishError, markdownErr, markdown])

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  const votingResults = useMemo(() => {
    const totalVotes: BN = [...(proposal?.choices || [])].reduce(
      (acc, { weight }) => weight.add(acc) as BN,
      new BN(0),
    )

    const results = proposal?.choices.map((r, index) => ({
      ...r,
      index,
      percent: totalVotes?.isZero()
        ? 100 / proposal?.choices.length
        : // Calculate with 4 decimals of precision
          r.weight.mul(new BN(10000)).div(totalVotes).toNumber() *
          (100 / 10000),
    }))

    return { results, totalVotes }
  }, [proposal])

  const derivedState = useMemo(
    () => getDerivedProposalState(proposal as ProposalV0),
    [proposal],
  )

  const positionMints = useMemo(
    () =>
      positions
        ?.filter((p) => !p.isProxiedToMe)
        .map((p) => p.mint.toBase58()) || [],
    [positions],
  )

  const handleVote = (choice: VoteChoiceWithMeta) => async () => {
    if (canVote(choice.index)) {
      setCurrVote(choice.index)
      await castVote(
        {
          proposalKey: proposalKey.toBase58(),
          positionMints,
          choice: choice.index,
        },
        {
          header: t('gov.transactions.castVote'),
          message: t('gov.proposals.castVoteFor', { choice: choice.name }),
        },
      )
      refetchState()
    }
  }

  const handleRelinquish = (choice: VoteChoiceWithMeta) => async () => {
    if (canRelinquishVote(choice.index)) {
      setCurrVote(choice.index)
      await doRelinquish(
        {
          proposalKey: proposalKey.toBase58(),
          positionMints,
          choice: choice.index,
        },
        {
          header: t('gov.transactions.relinquishVote'),
          message: t('gov.proposals.relinquishVoteFor', {
            choice: choice.name,
          }),
        },
      )
      refetchState()
    }
  }

  const endTs =
    resolution &&
    (proposal?.state.resolved
      ? proposal?.state.resolved.endTs
      : proposal?.state.voting?.startTs.add(
          resolution.settings.nodes.find(
            (node) => typeof node.offsetFromStartTs !== 'undefined',
          )?.offsetFromStartTs?.offset ?? new BN(0),
        ))

  const now = useNowAfter(endTs?.toNumber())
  const completed = endTs && endTs.toNumber() <= now / 1000
  const noVotingPower = !loading && (!votingPower || votingPower.isZero())
  const voted = !voteMutPending && didVote?.some((n) => n)
  const showVoteResults =
    derivedState !== 'cancelled' &&
    (voted ||
      derivedState === 'passed' ||
      derivedState === 'failed' ||
      derivedState === 'completed' ||
      completed)

  return (
    <Animated.View className="flex-1">
      <BackScreen
        headerClassName="mt-6"
        className="p-0"
        title="Proposal Overview"
        edges={backEdges}
      >
        <SafeArea edges={safeEdges} className="mt-6 flex-1 bg-transparent">
          <ScrollView contentInsetAdjustmentBehavior="automatic">
            <View className="px-4">
              <View className="grow justify-center rounded-[12px] bg-secondary p-4">
                <View className="flex-row">
                  {proposal?.tags
                    .filter((tag) => tag !== 'tags')
                    .map((tag, idx) => {
                      const tempCheck = tag.toLowerCase().includes('temp check')
                      return (
                        <View
                          key={tag}
                          className={`${idx > 0 ? 'ml-2' : ''} rounded-md p-2 ${
                            tempCheck ? 'bg-warning-100' : 'bg-background'
                          }`}
                        >
                          <Text
                            size="xs"
                            className={
                              tempCheck
                                ? 'text-warning-500'
                                : 'text-muted-foreground'
                            }
                          >
                            {tag.toUpperCase()}
                          </Text>
                        </View>
                      )
                    })}
                </View>
                <View className="mt-3 shrink">
                  <Text size="base" className="font-medium">
                    {proposal?.name}
                  </Text>
                </View>
                <View className="mt-3">
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
                          {humanReadable(votingResults?.totalVotes, decimals) ||
                            'None'}
                        </Text>
                      </View>
                    )}
                  </View>
                  {showVoteResults &&
                    votingResults?.totalVotes.gt(new BN(0)) && (
                      <View className="rounded-[12px] bg-secondary pt-4">
                        {votingResults.results
                          ?.sort((a, b) => b.percent - a.percent)
                          .map((r, idx) => (
                            <View
                              key={r.name}
                              className={`flex-1 ${idx > 0 ? 'mt-2' : ''}`}
                            >
                              <Text className="mb-1">{r.name}</Text>
                              <View className="mb-1 flex-1 flex-row overflow-hidden rounded-md bg-muted">
                                <View
                                  className="h-1.5 flex-row"
                                  style={{
                                    width: `${r.percent}%`,
                                    backgroundColor: votingResultColor(r.index),
                                  }}
                                />
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="mr-3 text-muted-foreground">
                                  {humanReadable(r.weight, decimals)}
                                </Text>
                                <Text>{r.percent.toFixed(2)}%</Text>
                              </View>
                            </View>
                          ))}
                      </View>
                    )}
                </View>
              </View>
              {noVotingPower && (
                <PressableScale
                  feedback="opacity"
                  onPress={() =>
                    navigation.push('PositionsScreen', {
                      mint: mint.toBase58(),
                    })
                  }
                >
                  <View className="mt-4 grow flex-row items-center justify-between rounded-[12px] bg-secondary p-4">
                    <Text className="text-warning-500">
                      {`${t('gov.votingPower.noPower')}, ${t(
                        'gov.votingPower.increase',
                      )}`}
                    </Text>
                    <Text size="xl" className="font-medium">
                      &gt;
                    </Text>
                  </View>
                </PressableScale>
              )}
              {derivedState === 'active' && !noVotingPower && (
                <>
                  <View className="mt-4 grow justify-center rounded-[12px] bg-secondary p-4">
                    <Text>
                      {t('gov.proposals.toVote', {
                        maxChoicesPerVoter: proposal?.maxChoicesPerVoter,
                        choicesLength: proposal?.choices.length,
                      })}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="flex-1 border-b border-border" />
                      <Text className="p-4 text-muted-foreground">OR</Text>
                      <View className="flex-1 border-b border-border" />
                    </View>
                    <Text>{t('gov.proposals.assignProxy')}</Text>
                    <Button
                      size="lg"
                      className="mt-4 w-full rounded-full"
                      onPress={handleBrowseProxies}
                    >
                      <BrowseProxiesIcon
                        size={16}
                        colorClassName="accent-primary-foreground"
                      />
                      <Text className={buttonTextVariants()}>
                        {t('gov.assignProxy.browseProxies')}
                      </Text>
                    </Button>
                  </View>
                  <View className="mt-4 grow justify-center gap-3">
                    {showError && (
                      <View className="flex-row rounded-[12px] bg-secondary p-4">
                        <Text
                          size="xs"
                          className="font-medium text-destructive"
                        >
                          {showError}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1 flex-col gap-4">
                      {votingResults.results?.map((r) => (
                        <View
                          key={r.name}
                          className="rounded-[12px] bg-secondary p-1"
                        >
                          <VoteOption
                            voters={voters?.[r.index] || []}
                            voting={
                              currVote === r.index &&
                              (voteMutPending || relinquishMutPending)
                            }
                            option={r}
                            didVote={didVote?.[r.index]}
                            canVote={canVote(r.index) ?? false}
                            canRelinquishVote={
                              canRelinquishVote(r.index) ?? false
                            }
                            onVote={handleVote(r)}
                            onRelinquishVote={handleRelinquish(r)}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
              {markdown && (
                <View className="mt-4 grow justify-center rounded-[12px] bg-secondary p-4">
                  <Markdown markdown={markdown} />
                </View>
              )}
            </View>
          </ScrollView>
        </SafeArea>
      </BackScreen>
    </Animated.View>
  )
}

export default ProposalScreen
