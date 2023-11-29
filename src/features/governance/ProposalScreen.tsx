import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
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
import { RouteProp, useRoute } from '@react-navigation/native'
import { useTheme } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import globalStyles from '@theme/globalStyles'
import { Theme } from '@theme/theme'
import { fmtUnixTime, humanReadable } from '@utils/formatting'
import axios from 'axios'
import BN from 'bn.js'
import React, { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { ScrollView } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { Edge } from 'react-native-safe-area-context'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { VoteOption } from './VoteOption'
import {
  GovernanceStackParamList,
  ProposalFilter,
  VoteChoiceWithMeta,
  VotingResultColors,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'ProposalScreen'>
export const ProposalScreen = () => {
  const route = useRoute<Route>()
  const theme = useTheme<Theme>()
  const { params } = route
  const { proposal: pk } = params
  const [currVote, setCurrVote] = useState(0)
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const proposalKey = useMemo(() => new PublicKey(pk), [pk])
  const { walletSignBottomSheetRef } = useWalletSign()
  const { loading, amountLocked } = useGovernance()
  const { info: proposal } = useProposal(proposalKey)
  const { info: proposalConfig } = useProposalConfig(proposal?.proposalConfig)
  const { info: registrar } = useRegistrar(proposalConfig?.voteController)
  const decimals = useMint(registrar?.votingMints[0].mint)?.info?.decimals
  const { info: resolution } = useResolutionSettings(
    proposalConfig?.stateController,
  )

  const {
    voteWeights,
    canVote,
    vote,
    loading: voting,
    error: voteErr,
  } = useVote(proposalKey)

  const {
    canRelinquishVote,
    relinquishVote,
    loading: relinquishing,
    error: relErr,
  } = useRelinquishVote(proposalKey)

  const {
    error: markdownErr,
    loading: markdownLoading,
    result: markdown,
  } = useAsync(async () => {
    if (proposal && proposal.uri) {
      const { data } = await axios.get(proposal.uri)
      return data
    }
  }, [proposal])

  const transactionError = useMemo(() => {
    if (markdownErr) {
      return markdownErr.message || 'Failed to retrive proposal markdown.'
    }

    if (voteErr) {
      return voteErr.message || 'Vote failed, please try again.'
    }

    if (relErr) {
      return relErr.message || 'Relinquish vote failed, please try again.'
    }

    return undefined
  }, [voteErr, relErr, markdownErr])

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  const votingResults = useMemo(() => {
    const totalVotes: BN = [...(proposal?.choices || [])].reduce(
      (acc, { weight }) => weight.add(acc) as BN,
      new BN(0),
    )

    const results = proposal?.choices
      .map((r, index) => ({
        ...r,
        index,
        percent: totalVotes?.isZero()
          ? 100 / proposal?.choices.length
          : (r.weight.toNumber() / totalVotes.toNumber()) * 100,
      }))
      .sort((a, b) => b.percent - a.percent)

    return { results, totalVotes }
  }, [proposal])

  const derivedState: Omit<ProposalFilter, 'all'> | undefined = useMemo(() => {
    if (proposal?.state && proposal?.choices) {
      const keys = Object.keys(proposal.state)
      if (keys.includes('voting')) return 'active'
      if (keys.includes('cancelled')) return 'cancelled'
      if (
        keys.includes('resolved') &&
        proposal.state.resolved &&
        proposal.state.resolved.choices.length > 0
      )
        return 'passed'
      if (
        keys.includes('resolved') &&
        proposal.state.resolved &&
        (proposal.state.resolved.choices.length === 0 ||
          (proposal.state.resolved.choices.length === 1 &&
            proposal.choices[proposal.state.resolved.choices[0]].name === 'No'))
      )
        return 'failed'
    }
  }, [proposal?.state, proposal?.choices])

  const getDecision = async (header: string) => {
    let decision

    if (walletSignBottomSheetRef) {
      decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header,
        serializedTxs: undefined,
      })
    }

    return decision
  }

  const handleVote = (choice: VoteChoiceWithMeta) => async () => {
    if (canVote(choice.index)) {
      const decision = await getDecision(`Vote: ${choice.name}`)

      if (decision) {
        setCurrVote(choice.index)
        vote({ choice: choice.index })
      }
    }
  }

  const handleRelinquish = (choice: VoteChoiceWithMeta) => async () => {
    if (canRelinquishVote(choice.index)) {
      const decision = await getDecision('Relinquish Vote')

      if (decision) {
        setCurrVote(choice.index)
        relinquishVote({ choice: choice.index })
      }
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

  const noVotingPower = !loading && (!amountLocked || amountLocked.isZero())
  const showVoteResults = derivedState === 'passed' || derivedState === 'failed'

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <BackScreen
        headerTopMargin="l"
        padding="none"
        title="Proposal Overview"
        edges={backEdges}
      >
        <SafeAreaBox
          edges={safeEdges}
          backgroundColor="transparent"
          flex={1}
          marginTop="l"
        >
          <ScrollView>
            <Box
              flexGrow={1}
              justifyContent="center"
              backgroundColor="secondaryBackground"
              borderRadius="l"
              padding="m"
            >
              <Box flexDirection="row" gap="s">
                {proposal?.tags
                  .filter((tag) => tag !== 'tags')
                  .map((tag) => (
                    <Box
                      key={tag}
                      padding="s"
                      backgroundColor={
                        tag.toLowerCase().includes('temp check')
                          ? 'orange500'
                          : 'surfaceSecondary'
                      }
                      borderRadius="m"
                    >
                      <Text variant="body3" color="secondaryText">
                        {tag.toUpperCase()}
                      </Text>
                    </Box>
                  ))}
              </Box>
              <Box marginTop="ms">
                <Box flexDirection="row" justifyContent="space-between">
                  <Box>
                    {derivedState === 'active' && (
                      <Text variant="body2" color="secondaryText">
                        Est. Time Remaining
                      </Text>
                    )}
                    {derivedState === 'passed' && (
                      <Text variant="body2" color="greenBright500">
                        Success
                      </Text>
                    )}
                    {derivedState === 'failed' && (
                      <Text variant="body2" color="error">
                        Failed
                      </Text>
                    )}
                    {derivedState === 'cancelled' && (
                      <Text variant="body2" color="orange500">
                        Cancelled
                      </Text>
                    )}
                    <Text variant="body2" color="primaryText">
                      {fmtUnixTime(endTs || new BN(0))}
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      variant="body2"
                      color="secondaryText"
                      textAlign="right"
                    >
                      Votes
                    </Text>
                    <Text variant="body2" color="primaryText" textAlign="right">
                      {humanReadable(votingResults?.totalVotes, decimals) ||
                        'None'}
                    </Text>
                  </Box>
                </Box>
                {showVoteResults && votingResults?.totalVotes.gt(new BN(0)) && (
                  <Box
                    backgroundColor="secondaryBackground"
                    borderRadius="l"
                    paddingTop="m"
                    gap="s"
                  >
                    {votingResults.results?.map((r) => (
                      <Box key={r.name} flex={1}>
                        <Box
                          flexDirection="row"
                          flex={1}
                          backgroundColor="grey900"
                          borderRadius="m"
                          overflow="hidden"
                          marginBottom="xs"
                        >
                          <Box
                            flexDirection="row"
                            height={6}
                            width={`${r.percent}%`}
                            backgroundColor={VotingResultColors[r.index]}
                          />
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between">
                          <Text variant="body2" color="primaryText">
                            {r.name}
                          </Text>
                          <Box flexDirection="row">
                            <Text
                              variant="body2"
                              color="secondaryText"
                              marginRight="ms"
                            >
                              {humanReadable(r.weight, decimals)}
                            </Text>
                            <Text variant="body2" color="primaryText">
                              {r.percent.toFixed(2)}%
                            </Text>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
            {noVotingPower && (
              <Box
                flexGrow={1}
                justifyContent="center"
                backgroundColor="secondaryBackground"
                borderRadius="l"
                padding="m"
                marginTop="m"
              >
                <Text variant="body2" color="primaryText">
                  You have no voting power in this dao
                </Text>
              </Box>
            )}
            {derivedState === 'active' && !noVotingPower && (
              <Box
                flexGrow={1}
                justifyContent="center"
                backgroundColor="secondaryBackground"
                borderRadius="l"
                padding="m"
                marginTop="m"
              >
                <Text variant="body2" color="primaryText">
                  To vote, click on any option. To remove your vote, click the
                  option again. Vote for up to {proposal?.maxChoicesPerVoter} of{' '}
                  {proposal?.choices.length} options.
                </Text>
                <Box marginTop="ms">
                  {showError && (
                    <Box flexDirection="row" paddingBottom="ms">
                      <Text variant="body3Medium" color="red500">
                        {showError}
                      </Text>
                    </Box>
                  )}
                  <Box flex={1} flexDirection="row" flexWrap="wrap" gap="s">
                    {votingResults.results?.map((r) => (
                      <VoteOption
                        key={r.name}
                        voting={
                          currVote === r.index && (voting || relinquishing)
                        }
                        option={r}
                        myWeight={voteWeights?.[r.index]}
                        canVote={canVote(r.index)}
                        canRelinquishVote={canRelinquishVote(r.index)}
                        onVote={handleVote(r)}
                        onRelinquishVote={handleRelinquish(r)}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
            <Box
              flexGrow={1}
              justifyContent="center"
              backgroundColor="secondaryBackground"
              borderRadius="l"
              padding="m"
              marginTop="m"
            >
              {!markdownLoading && markdown && (
                <Markdown
                  style={{
                    body: {
                      ...theme.textVariants.body2,
                      color: theme.colors.primaryText,
                    },
                    heading1: {
                      ...theme.textVariants.subtitle1,
                      color: theme.colors.primaryText,
                      paddingTop: theme.spacing.ms,
                      paddingBottom: theme.spacing.ms,
                    },
                    heading2: {
                      ...theme.textVariants.subtitle2,
                      color: theme.colors.primaryText,
                      paddingTop: theme.spacing.ms,
                      paddingBottom: theme.spacing.ms,
                    },
                    heading3: {
                      ...theme.textVariants.subtitle3,
                      color: theme.colors.primaryText,
                      paddingTop: theme.spacing.ms,
                      paddingBottom: theme.spacing.ms,
                    },
                  }}
                >
                  {markdown}
                </Markdown>
              )}
            </Box>
          </ScrollView>
        </SafeAreaBox>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default ProposalScreen
