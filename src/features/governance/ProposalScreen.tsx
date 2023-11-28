import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useMint } from '@helium/helium-react-hooks'
import {
  useProposal,
  useProposalConfig,
  useResolutionSettings,
} from '@helium/modular-governance-hooks'
import { useRegistrar } from '@helium/voter-stake-registry-hooks'
import { RouteProp, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import globalStyles from '@theme/globalStyles'
import { fmtUnixTime, humanReadable } from '@utils/formatting'
import axios from 'axios'
import React, { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { Theme } from '@theme/theme'
import BN from 'bn.js'
import Markdown from 'react-native-markdown-display'
import { useTheme } from '@shopify/restyle'
import {
  GovernanceStackParamList,
  ProposalFilter,
  VotingResultColors,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'ProposalScreen'>
export const ProposalScreen = () => {
  const route = useRoute<Route>()
  const theme = useTheme<Theme>()
  const { params } = route
  const { proposal: pk } = params
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const proposalK = useMemo(() => new PublicKey(pk), [pk])
  const { info: proposal } = useProposal(proposalK)
  const { info: proposalConfig } = useProposalConfig(proposal?.proposalConfig)
  const { info: registrar } = useRegistrar(proposalConfig?.voteController)
  const { info: resolution } = useResolutionSettings(
    proposalConfig?.stateController,
  )
  const decimals = useMint(registrar?.votingMints[0].mint)?.info?.decimals

  const endTs =
    resolution &&
    (proposal?.state.resolved
      ? proposal?.state.resolved.endTs
      : proposal?.state.voting?.startTs.add(
          resolution.settings.nodes.find(
            (node) => typeof node.offsetFromStartTs !== 'undefined',
          )?.offsetFromStartTs?.offset ?? new BN(0),
        ))

  const {
    error: markdownError,
    loading: markdownLoading,
    result: markdown,
  } = useAsync(async () => {
    if (proposal && proposal.uri) {
      const { data } = await axios.get(proposal.uri)
      return data
    }
  }, [proposal])

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
              <Box flexDirection="row">
                {proposal?.tags
                  .filter((tag) => tag !== 'tags')
                  .map((tag, idx) => (
                    <Box
                      key={tag}
                      padding="s"
                      marginLeft={idx > 0 ? 's' : 'none'}
                      backgroundColor={
                        tag.toLowerCase().includes('temp check')
                          ? 'orange500'
                          : 'surfaceSecondary'
                      }
                      borderRadius="m"
                    >
                      <Text fontSize={10} color="secondaryText">
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
                {(derivedState === 'active' ||
                  derivedState === 'passed' ||
                  derivedState === 'failed') &&
                  votingResults?.totalVotes.gt(new BN(0)) && (
                    <Box
                      backgroundColor="secondaryBackground"
                      borderRadius="l"
                      paddingTop="m"
                    >
                      {votingResults.results?.map((r, idx) => (
                        <Box
                          key={r.name}
                          flex={1}
                          marginTop={idx > 0 ? 's' : 'none'}
                        >
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
                              backgroundColor={VotingResultColors[idx]}
                            />
                          </Box>
                          <Box
                            flexDirection="row"
                            justifyContent="space-between"
                          >
                            <Text
                              fontSize={10}
                              variant="body2"
                              color="primaryText"
                            >
                              {r.name}
                            </Text>
                            <Box flexDirection="row">
                              <Text
                                fontSize={10}
                                variant="body2"
                                color="secondaryText"
                                marginRight="ms"
                              >
                                {humanReadable(r.weight, decimals)}
                              </Text>
                              <Text
                                fontSize={10}
                                variant="body2"
                                color="primaryText"
                              >
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
      {derivedState === 'active' && (
        <Box flexDirection="row" paddingTop="m">
          <ButtonPressable
            height={50}
            flex={1}
            fontSize={16}
            borderRadius="round"
            borderWidth={2}
            borderColor="white"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            title="Cast Vote"
            titleColor="black"
          />
        </Box>
      )}
    </ReAnimatedBox>
  )
}

export default ProposalScreen
