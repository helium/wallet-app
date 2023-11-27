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
} from '@helium/modular-governance-hooks'
import { useRegistrar } from '@helium/voter-stake-registry-hooks'
import { RouteProp, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import globalStyles from '@theme/globalStyles'
import { fmtUnixTime, humanReadable } from '@utils/formatting'
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import React, { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { Color } from '@theme/theme'
import BN from 'bn.js'
import { GovernanceStackParamList, ProposalFilter } from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'ProposalScreen'>
const markdownParser = MarkdownIt()
export const ProposalScreen = () => {
  const route = useRoute<Route>()
  const { params } = route
  const { proposal: pk } = params
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const proposalK = useMemo(() => new PublicKey(pk), [pk])
  const { info: proposal } = useProposal(proposalK)
  const { info: proposalConfig } = useProposalConfig(proposal?.proposalConfig)
  const { info: registrar } = useRegistrar(proposalConfig?.voteController)
  const decimals = useMint(registrar?.votingMints[0].mint)?.info?.decimals

  const {
    error: markdownError,
    loading: markdownLoading,
    result: markdown,
  } = useAsync(async () => {
    if (proposal && proposal.uri) {
      const { data } = await axios.get(proposal.uri)
      const htmlContent = markdownParser.render(data)
      return htmlContent
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
      <ScrollView>
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
            <Box
              flexGrow={1}
              justifyContent="center"
              backgroundColor="secondaryBackground"
              borderRadius="l"
              padding="m"
            >
              <Box flexDirection="row">
                {proposal?.tags.map((tag, idx) => (
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
              <Text
                textAlign="left"
                variant="subtitle2"
                adjustsFontSizeToFit
                paddingTop="m"
              >
                {proposal?.name}
              </Text>
              <Box
                marginTop="s"
                paddingTop={derivedState === 'active' ? 's' : 'none'}
                paddingBottom={derivedState === 'active' ? 'm' : 's'}
              >
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  paddingBottom={derivedState === 'active' ? 's' : 'none'}
                >
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
                    {(derivedState === 'passed' ||
                      derivedState === 'failed') && (
                      <Text variant="body2" color="primaryText">
                        {fmtUnixTime(
                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          proposal!.state.resolved!.endTs.toNumber(),
                        )}
                      </Text>
                    )}
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
                {derivedState === 'active' && (
                  <Box
                    flexDirection="row"
                    flex={1}
                    height={6}
                    borderRadius="m"
                    overflow="hidden"
                  >
                    {votingResults.results?.map((result, idx) => {
                      const backgroundColors: Color[] = [
                        'turquoise',
                        'orange500',
                        'jazzberryJam',
                        'purple500',
                        'purpleHeart',
                      ]
                      return (
                        <Box
                          key={result.name}
                          width={`${result.percent}%`}
                          backgroundColor={backgroundColors[idx]}
                        />
                      )
                    })}
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
            />
          </SafeAreaBox>
        </BackScreen>
      </ScrollView>
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
    </ReAnimatedBox>
  )
}

export default ProposalScreen
