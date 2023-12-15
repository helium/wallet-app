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
import Unseen from '@assets/images/unseen.svg'
import { useColors } from '@theme/themeHooks'
import { ProposalFilter, ProposalV0 } from './governanceTypes'

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
    backgroundColor="secondaryBackground"
    borderRadius="l"
    padding="xxl"
    entering={FadeIn}
    exiting={FadeOut}
    {...boxProps}
  />
)
export const ProposalCard = ({
  filter,
  proposal,
  proposalKey,
  onPress,
  ...boxProps
}: IProposalCardProps) => {
  const { t } = useTranslation()
  const colors = useColors()
  const { upsertAccount, currentAccount } = useAccountStorage()
  const { mint } = useGovernance()
  const { proposalConfig: proposalConfigKey } = proposal
  const decimals = useMint(mint)?.info?.decimals
  const { info: proposalConfig } = useProposalConfig(proposalConfigKey)
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

  const derivedState: Omit<ProposalFilter, 'all' | 'unseen'> | undefined =
    useMemo(() => {
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
              proposal.choices[proposal.state.resolved.choices[0]].name ===
                'No'))
        )
          return 'failed'
      }
    }, [proposal?.state, proposal?.choices])

  const isLoading = descLoading
  const isVisible = useMemo(() => {
    if (!isLoading) {
      if (!proposal) return false
      if (filter === 'all') return true
      if (filter === 'unseen' && !hasSeen) return true
      return derivedState === filter
    }
  }, [filter, hasSeen, derivedState, proposal, isLoading])

  const handleOnPress = useCallback(async () => {
    if (onPress) await onPress(mint, proposalKey)
    if (!hasSeen && currentAccount) {
      const proposalIdsSeenByMint = {
        ...(currentAccount.proposalIdsSeenByMint || {}),
        [mint.toBase58()]: [
          ...(currentAccount.proposalIdsSeenByMint
            ? currentAccount.proposalIdsSeenByMint[mint.toBase58()]
            : []),
          proposalKey.toBase58(),
        ],
      }

      await upsertAccount({
        ...currentAccount,
        proposalIdsSeenByMint,
      })
    }
  }, [mint, proposalKey, onPress, hasSeen, currentAccount, upsertAccount])

  if (!isVisible) return null
  if (isLoading) {
    return <ProposalCardSkeleton {...boxProps} />
  }

  return (
    <ReAnimatedBox
      backgroundColor="secondaryBackground"
      borderRadius="l"
      position="relative"
      entering={FadeIn}
      exiting={FadeOut}
      {...boxProps}
    >
      <TouchableOpacityBox onPress={handleOnPress}>
        <Box
          position="relative"
          paddingTop="ms"
          padding="m"
          paddingBottom={derivedState === 'active' ? 'm' : 's'}
        >
          <Box flexDirection="row" alignItems="center" marginBottom="s">
            {!hasSeen && (
              <Box
                backgroundColor="surfaceSecondary"
                flexDirection="row"
                alignItems="center"
                padding="s"
                borderRadius="m"
                marginRight="s"
              >
                <Unseen height={12} width={12} color={colors.orange500} />
                <Text fontSize={10} color="secondaryText" marginLeft="s">
                  UNSEEN
                </Text>
              </Box>
            )}
            {proposal?.tags
              .filter((tag) => tag !== 'tags')
              .map((tag) => (
                <Box key={tag} marginRight="s">
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
          <Box flexDirection="row">
            <Text variant="subtitle3" color="primaryText">
              {proposal?.name}
            </Text>
          </Box>
          {derivedState === 'active' && (
            <Text
              variant="body2"
              marginTop="xs"
              color="surfaceSecondaryText"
              numberOfLines={2}
            >
              {!descError && desc ? desc : t('gov.proposals.noDescription')}
            </Text>
          )}
        </Box>
        {/* todo (gov): add back once we can derive what they voted easily */}
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
        {}
        <Box
          paddingHorizontal="m"
          /* todo (gov): add back once we can derive what they voted easily */
          /* paddingTop={derivedState === 'active' ? 'm' : 'none'} */
          paddingBottom="ms"
        >
          <Box flexDirection="row" justifyContent="space-between">
            <Box>
              {derivedState === 'active' && (
                <Text variant="body2" color="secondaryText">
                  {t('gov.proposals.estTime')}
                </Text>
              )}
              {derivedState === 'passed' && (
                <Text variant="body2" color="greenBright500">
                  {t('gov.proposals.success')}
                </Text>
              )}
              {derivedState === 'failed' && (
                <Text variant="body2" color="error">
                  {t('gov.proposals.failed')}
                </Text>
              )}
              {derivedState === 'cancelled' && (
                <Text variant="body2" color="orange500">
                  {t('gov.proposals.cancelled')}
                </Text>
              )}
              <Text variant="body2" color="primaryText">
                {getTimeFromNowFmt(endTs || new BN(0))}
              </Text>
            </Box>
            <Box>
              <Text variant="body2" color="secondaryText" textAlign="right">
                {t('gov.proposals.votes')}
              </Text>
              <Text variant="body2" color="primaryText" textAlign="right">
                {humanReadable(votingResults?.totalVotes, decimals) || 'None'}
              </Text>
            </Box>
          </Box>
        </Box>
      </TouchableOpacityBox>
    </ReAnimatedBox>
  )
}
