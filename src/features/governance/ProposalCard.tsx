import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
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
import { humanReadable } from '@utils/formatting'
import axios from 'axios'
import BN from 'bn.js'
import MarkdownIt from 'markdown-it'
import React, { useCallback, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { getTimeFromNowFmt } from '@utils/dateTools'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { getDerivedProposalState } from '@utils/governanceUtils'
import { ProposalFilter, ProposalV0 } from './governanceTypes'
import { ProposalTags } from './ProposalTags'

interface IProposalCardProps extends BoxProps<Theme> {
  filter: ProposalFilter
  proposal: ProposalV0
  proposalKey: PublicKey
  onPress?: (mint: PublicKey, proposal: PublicKey) => Promise<void>
}

const markdownParser = MarkdownIt()
export const ProposalCardSkeleton = (boxProps: BoxProps<Theme>) => (
  <ReAnimatedBox
    flex={1}
    backgroundColor="base.black"
    borderRadius="2xl"
    padding="15"
    entering={FadeIn}
    exiting={FadeOut}
    {...boxProps}
  />
)
export const ProposalCard = ({
  proposal,
  proposalKey,
  onPress,
  ...boxProps
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

  const derivedState = useMemo(
    () => getDerivedProposalState(proposal),
    [proposal],
  )

  const hasSeen = useMemo(() => {
    if (currentAccount?.proposalIdsSeenByMint) {
      return currentAccount.proposalIdsSeenByMint[mint.toBase58()]?.includes(
        proposalKey.toBase58(),
      )
    }
  }, [currentAccount?.proposalIdsSeenByMint, mint, proposalKey])

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
        : t('gov.proposals.noDescription')
    }
  }, [proposal])

  const votingResults = useMemo(() => {
    const totalVotes: BN = [...(proposal?.choices || [])].reduce(
      (acc, { weight }) => weight.add(acc) as BN,
      new BN(0),
    )

    return { totalVotes }
  }, [proposal])

  const completed = endTs && endTs.toNumber() <= Date.now().valueOf() / 1000
  const isLoading = descLoading
  const handleOnPress = useCallback(async () => {
    if (onPress) await onPress(mint, proposalKey)
  }, [mint, proposalKey, onPress])

  if (isLoading) return null
  return (
    <ReAnimatedBox
      backgroundColor="bg.tertiary"
      borderRadius="2xl"
      position="relative"
      entering={FadeIn}
      exiting={FadeOut}
      {...boxProps}
    >
      <TouchableOpacityBox onPress={handleOnPress}>
        <Box
          position="relative"
          paddingTop="3"
          padding="4"
          paddingBottom={derivedState === 'active' ? '4' : '2'}
        >
          <Box flexDirection="row" flexWrap="wrap">
            {!hasSeen && derivedState === 'active' && !completed && (
              <Box marginRight="2" marginBottom="2">
                <Box
                  flexDirection="row"
                  padding="2"
                  alignItems="center"
                  backgroundColor="cardBackground"
                  borderRadius="2xl"
                >
                  <Box
                    zIndex={2}
                    width={10}
                    height={10}
                    backgroundColor="orange.500"
                    borderRadius="full"
                  />
                  <Text
                    variant="textSmRegular"
                    fontSize={10}
                    color="secondaryText"
                    marginLeft="2"
                  >
                    UNSEEN
                  </Text>
                </Box>
              </Box>
            )}
            {hasSeen && derivedState === 'active' && !completed && (
              <Box marginRight="2" marginBottom="2">
                <Box
                  flexDirection="row"
                  padding="2"
                  alignItems="center"
                  backgroundColor="cardBackground"
                  borderRadius="2xl"
                >
                  <Box
                    zIndex={2}
                    width={10}
                    height={10}
                    backgroundColor="blue.light-500"
                    borderRadius="full"
                  />
                  <Text
                    variant="textSmRegular"
                    fontSize={10}
                    color="secondaryText"
                    marginLeft="2"
                  >
                    ACTIVE
                  </Text>
                </Box>
              </Box>
            )}
            <ProposalTags tags={proposal?.tags} />
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text variant="textMdSemibold" color="primaryText" flexShrink={1}>
              {proposal?.name}
            </Text>
          </Box>
          {derivedState === 'active' && (
            <Text
              variant="textSmRegular"
              marginTop="xs"
              color="secondaryText"
              numberOfLines={2}
            >
              {!descError && desc ? desc : t('gov.proposals.noDescription')}
            </Text>
          )}
        </Box>
        {/* TODO (gov): add back once we can derive what they voted easily */}
        {/*         {derivedState === 'active' && (
          <Box
            borderTopColor="primaryBackground"
            borderTopWidth={2}
            borderBottomColor="primaryBackground"
            borderBottomWidth={2}
            paddingHorizontal="4"
            paddingVertical="2"
          >
            <Text variant="textSmRegular" color="secondaryText">
              You Voted - Yes
            </Text>
          </Box>
        )} */}
        {}
        <Box
          paddingHorizontal="4"
          /* TODO (gov): add back once we can derive what they voted easily */
          /* paddingTop={derivedState === 'active' ? '4' : 'none'} */
          paddingBottom="3"
        >
          <Box flexDirection="row" justifyContent="space-between">
            <Box>
              {derivedState === 'active' && !completed && (
                <Text variant="textSmRegular" color="secondaryText">
                  {t('gov.proposals.estTime')}
                </Text>
              )}
              {derivedState === 'active' && completed && (
                <Text variant="textSmRegular" color="secondaryText">
                  {t('gov.proposals.votingClosed')}
                </Text>
              )}
              {derivedState === 'passed' && (
                <Text variant="textSmRegular" color="success.500">
                  {t('gov.proposals.success')}
                </Text>
              )}
              {derivedState === 'completed' && (
                <Text variant="textSmRegular" color="success.500">
                  {t('gov.proposals.completed')}
                </Text>
              )}
              {derivedState === 'failed' && (
                <Text variant="textSmRegular" color="error.500">
                  {t('gov.proposals.failed')}
                </Text>
              )}
              {derivedState === 'cancelled' && (
                <Text variant="textSmRegular" color="orange.500">
                  {t('gov.proposals.cancelled')}
                </Text>
              )}
              {derivedState !== 'cancelled' && (
                <Text variant="textSmRegular" color="primaryText">
                  {getTimeFromNowFmt(endTs || new BN(0))}
                </Text>
              )}
            </Box>
            {derivedState !== 'cancelled' && (
              <Box>
                <Text
                  variant="textSmRegular"
                  color="secondaryText"
                  textAlign="right"
                >
                  {t('gov.proposals.votes')}
                </Text>
                <Text
                  variant="textSmRegular"
                  color="primaryText"
                  textAlign="right"
                >
                  {humanReadable(votingResults?.totalVotes, decimals) || 'None'}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </TouchableOpacityBox>
    </ReAnimatedBox>
  )
}
