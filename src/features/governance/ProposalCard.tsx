import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint } from '@helium/helium-react-hooks'
import {
  useProposalConfig,
  useResolutionSettings,
} from '@helium/modular-governance-hooks'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { Theme } from '@theme/theme'
import { fmtUnixTime, humanReadable } from '@utils/formatting'
import axios from 'axios'
import BN from 'bn.js'
import MarkdownIt from 'markdown-it'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import {
  ProposalFilter,
  ProposalV0,
  VotingResultColors,
} from './governanceTypes'

interface IProposalCardProps extends BoxProps<Theme> {
  filter: ProposalFilter
  proposal: ProposalV0
  proposalKey: PublicKey
  onPress?: (proposal: PublicKey) => Promise<void>
}

const markdownParser = MarkdownIt()
export const ProposalCardSkeleton = (boxProps: BoxProps<Theme>) => (
  <ReAnimatedBox
    flex={1}
    backgroundColor="secondaryBackground"
    borderRadius="l"
    padding="xxl"
    entering={FadeIn}
    exiting={FadeOut}
    {...boxProps}
  >
    <CircleLoader color="white" loaderSize={20} />
  </ReAnimatedBox>
)
export const ProposalCard = ({
  filter,
  proposal,
  proposalKey,
  onPress,
  ...boxProps
}: IProposalCardProps) => {
  const { loading, mint } = useGovernance()
  const { proposalConfig: proposalConfigKey } = proposal
  const decimals = useMint(mint)?.info?.decimals
  const { info: proposalConfig } = useProposalConfig(proposalConfigKey)
  const { info: resolution } = useResolutionSettings(
    proposalConfig?.stateController,
  )

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
    error: descError,
    loading: descLoading,
    result: desc,
  } = useAsync(async () => {
    if (proposal && proposal.uri) {
      const { data } = await axios.get(proposal.uri)
      const htmlContent = markdownParser.render(data)
      const firstParagraphMatch = htmlContent.match(/<p>(.*?)<\/p>/i)
      return firstParagraphMatch
        ? firstParagraphMatch[0].replace(/<[^>]+>/g, '')
        : 'No description for this propodal'
    }
  }, [proposal])

  // TODO (gov): Add better error handling
  useEffect(() => {
    if (descError) console.error(descError)
  }, [descError])

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

  const isLoading = useMemo(
    () => loading || descLoading,
    [loading, descLoading],
  )

  const isVisible = useMemo(() => {
    if (!isLoading) {
      if (!proposal) return false
      if (filter === 'all') return true
      return derivedState === filter
    }
  }, [filter, derivedState, proposal, isLoading])

  const handleOnPress = useCallback(async () => {
    if (onPress) await onPress(proposalKey)
  }, [proposalKey, onPress])

  if (!isVisible) return null
  if (isLoading) {
    return <ProposalCardSkeleton {...boxProps} />
  }

  return (
    <ReAnimatedBox
      backgroundColor="secondaryBackground"
      borderRadius="l"
      entering={FadeIn}
      exiting={FadeOut}
      {...boxProps}
    >
      <TouchableOpacityBox onPress={handleOnPress}>
        <Box
          paddingTop="ms"
          padding="m"
          paddingBottom={derivedState === 'active' ? 'm' : 's'}
        >
          <Box flexDirection="row" justifyContent="space-between">
            <Box flexShrink={1}>
              <Text variant="subtitle3" color="primaryText">
                {proposal?.name}
              </Text>
            </Box>
            <Box flexDirection="row" marginLeft="s">
              {proposal?.tags
                .filter((tag) => tag !== 'tags')
                .map((tag, idx) => (
                  <Box key={tag} marginLeft={idx > 0 ? 's' : 'none'}>
                    <Box
                      padding="s"
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
                  </Box>
                ))}
            </Box>
          </Box>
          {derivedState === 'active' && (
            <Text
              variant="body2"
              color="surfaceSecondaryText"
              numberOfLines={2}
            >
              {desc}
            </Text>
          )}
        </Box>
        {/* todo: add back once we can derive what they voted easily */}
        {/*         {derivedState === 'active' && (
          <Box
            borderTopColor="primaryBackground"
            borderTopWidth={2}
            borderBottomColor="primaryBackground"
            borderBottomWidth={2}
            paddingHorizontal="m"
            paddingVertical="s"
          >
            <Text variant="body2" color="secondaryText">
              You Voted - Yes
            </Text>
          </Box>
        )} */}
        <Box
          paddingHorizontal="m"
          /* todo: add back once we can derive what they voted easily */
          /* paddingTop={derivedState === 'active' ? 'm' : 'none'} */
          paddingBottom="ms"
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
              <Text variant="body2" color="primaryText">
                {fmtUnixTime(endTs || new BN(0))}
              </Text>
            </Box>
            {}
            <Box>
              <Text variant="body2" color="secondaryText" textAlign="right">
                Votes
              </Text>
              <Text variant="body2" color="primaryText" textAlign="right">
                {humanReadable(votingResults?.totalVotes, decimals) || 'None'}
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
              {votingResults.results?.map((result, idx) => (
                <Box
                  key={result.name}
                  width={`${result.percent}%`}
                  backgroundColor={VotingResultColors[idx]}
                />
              ))}
            </Box>
          )}
        </Box>
      </TouchableOpacityBox>
    </ReAnimatedBox>
  )
}
