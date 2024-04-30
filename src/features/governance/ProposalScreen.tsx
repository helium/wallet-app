import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint } from '@helium/helium-react-hooks'
import {
  useProposal,
  useProposalConfig,
  useResolutionSettings,
} from '@helium/modular-governance-hooks'
import {
  batchInstructionsToTxsWithPriorityFee,
  bulkSendTransactions,
  populateMissingDraftInfo,
  toVersionedTx,
} from '@helium/spl-utils'
import {
  useRegistrar,
  useRelinquishVote,
  useVote,
} from '@helium/voter-stake-registry-hooks'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTheme } from '@shopify/restyle'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useGovernance } from '@storage/GovernanceProvider'
import globalStyles from '@theme/globalStyles'
import { Theme } from '@theme/theme'
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '@utils/constants'
import { getTimeFromNowFmt } from '@utils/dateTools'
import { humanReadable } from '@utils/formatting'
import { getDerivedProposalState } from '@utils/governanceUtils'
import { getBasePriorityFee } from '@utils/walletApiV2'
import axios from 'axios'
import BN from 'bn.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { VoteOption } from './VoteOption'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
  ProposalV0,
  VoteChoiceWithMeta,
  VotingResultColors,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'ProposalScreen'>
export const ProposalScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const theme = useTheme<Theme>()
  const { upsertAccount, currentAccount } = useAccountStorage()
  const [currVote, setCurrVote] = useState(0)
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const proposalKey = useMemo(
    () => new PublicKey(route.params.proposal),
    [route.params.proposal],
  )
  const { anchorProvider } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { mint, setMint, loading, amountLocked } = useGovernance()
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
    if (mint && route.params.mint) {
      const routeMint = new PublicKey(route.params.mint)

      if (!mint.equals(routeMint)) {
        setMint(routeMint)
      }
    }
  }, [mint, route, setMint])

  useAsync(async () => {
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
  }, [hasSeen])

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
  }, [])

  const transactionError = useMemo(() => {
    if (markdownErr) {
      return markdownErr.message || t('gov.errors.markdown')
    }

    if (voteErr) {
      return voteErr.message || t('gov.errors.castVote')
    }

    if (relErr) {
      return relErr.message || t('gov.errors.relinquishVote')
    }

    return undefined
  }, [t, voteErr, relErr, markdownErr])

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

  const decideAndExecute = async (
    header: string,
    instructions: TransactionInstruction[],
  ) => {
    if (!anchorProvider || !walletSignBottomSheetRef) return

    const transactions = await batchInstructionsToTxsWithPriorityFee(
      anchorProvider,
      instructions,
      {
        basePriorityFee: await getBasePriorityFee(),
      },
    )
    const populatedTxs = await Promise.all(
      transactions.map((tx) =>
        populateMissingDraftInfo(anchorProvider.connection, tx),
      ),
    )
    const txs = populatedTxs.map((tx) => toVersionedTx(tx))

    const decision = await walletSignBottomSheetRef.show({
      type: WalletStandardMessageTypes.signTransaction,
      url: '',
      header,
      serializedTxs: txs.map((transaction) =>
        Buffer.from(transaction.serialize()),
      ),
    })

    if (decision) {
      await bulkSendTransactions(
        anchorProvider,
        transactions,
        undefined,
        10,
        [],
        MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
      )
    } else {
      throw new Error('User rejected transaction')
    }
  }

  const handleVote = (choice: VoteChoiceWithMeta) => async () => {
    if (canVote(choice.index)) {
      setCurrVote(choice.index)
      await vote({
        choice: choice.index,
        onInstructions: (ixs) =>
          decideAndExecute(t('gov.transactions.castVote'), ixs),
      })
    }
  }

  const handleRelinquish = (choice: VoteChoiceWithMeta) => async () => {
    if (canRelinquishVote(choice.index)) {
      setCurrVote(choice.index)
      relinquishVote({
        choice: choice.index,
        onInstructions: async (instructions) =>
          decideAndExecute(t('gov.transactions.relinquishVote'), instructions),
      })
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

  const completed = endTs && endTs.toNumber() <= Date.now().valueOf() / 1000
  const noVotingPower = !loading && (!amountLocked || amountLocked.isZero())
  const voted = !voting && voteWeights?.some((n) => n.gt(new BN(0)))
  const showVoteResults =
    derivedState !== 'cancelled' &&
    (voted ||
      derivedState === 'passed' ||
      derivedState === 'failed' ||
      derivedState === 'completed' ||
      completed)

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
            <Box paddingHorizontal="m">
              <Box
                flexGrow={1}
                justifyContent="center"
                backgroundColor="surfaceSecondary"
                borderRadius="l"
                padding="m"
              >
                <Box flexDirection="row">
                  {proposal?.tags
                    .filter((tag) => tag !== 'tags')
                    .map((tag, idx) => (
                      <Box
                        key={tag}
                        marginLeft={idx > 0 ? 's' : 'none'}
                        padding="s"
                        backgroundColor={
                          tag.toLowerCase().includes('temp check')
                            ? 'orange500'
                            : 'black600'
                        }
                        borderRadius="m"
                      >
                        <Text variant="body3" color="secondaryText">
                          {tag.toUpperCase()}
                        </Text>
                      </Box>
                    ))}
                </Box>
                <Box flexShrink={1} marginTop="ms">
                  <Text variant="subtitle3" color="primaryText">
                    {proposal?.name}
                  </Text>
                </Box>
                <Box marginTop="ms">
                  <Box flexDirection="row" justifyContent="space-between">
                    <Box>
                      {derivedState === 'active' && !completed && (
                        <Text variant="body2" color="secondaryText">
                          {t('gov.proposals.estTime')}
                        </Text>
                      )}
                      {derivedState === 'active' && completed && (
                        <Text variant="body2" color="secondaryText">
                          {t('gov.proposals.votingClosed')}
                        </Text>
                      )}
                      {derivedState === 'passed' && (
                        <Text variant="body2" color="greenBright500">
                          {t('gov.proposals.success')}
                        </Text>
                      )}
                      {derivedState === 'completed' && (
                        <Text variant="body2" color="greenBright500">
                          {t('gov.proposals.completed')}
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
                      {derivedState !== 'cancelled' && (
                        <Text variant="body2" color="primaryText">
                          {getTimeFromNowFmt(endTs || new BN(0))}
                        </Text>
                      )}
                    </Box>
                    {derivedState !== 'cancelled' && (
                      <Box>
                        <Text
                          variant="body2"
                          color="secondaryText"
                          textAlign="right"
                        >
                          {t('gov.proposals.votes')}
                        </Text>
                        <Text
                          variant="body2"
                          color="primaryText"
                          textAlign="right"
                        >
                          {humanReadable(votingResults?.totalVotes, decimals) ||
                            'None'}
                        </Text>
                      </Box>
                    )}
                  </Box>
                  {showVoteResults && votingResults?.totalVotes.gt(new BN(0)) && (
                    <Box
                      backgroundColor="surfaceSecondary"
                      borderRadius="l"
                      paddingTop="m"
                    >
                      {votingResults.results
                        ?.sort((a, b) => b.percent - a.percent)
                        .map((r, idx) => (
                          <Box
                            key={r.name}
                            flex={1}
                            marginTop={idx > 0 ? 's' : 'none'}
                          >
                            <Text
                              variant="body2"
                              color="primaryText"
                              marginBottom="xs"
                            >
                              {r.name}
                            </Text>
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
                            <Box
                              flexDirection="row"
                              justifyContent="space-between"
                            >
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
                        ))}
                    </Box>
                  )}
                </Box>
              </Box>
              {noVotingPower && (
                <TouchableOpacityBox
                  onPress={() =>
                    navigation.push('VotingPowerScreen', {
                      mint: mint.toBase58(),
                    })
                  }
                >
                  <Box
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    flexGrow={1}
                    backgroundColor="surfaceSecondary"
                    borderRadius="l"
                    padding="m"
                    marginTop="m"
                  >
                    <Text variant="body2" color="flamenco">
                      {`${t('gov.votingPower.noPower')}, ${t(
                        'gov.votingPower.increase',
                      )}`}
                    </Text>
                    <Text variant="subtitle1" color="primaryText">
                      &gt;
                    </Text>
                  </Box>
                </TouchableOpacityBox>
              )}
              {derivedState === 'active' && !noVotingPower && (
                <Box
                  flexGrow={1}
                  justifyContent="center"
                  backgroundColor="surfaceSecondary"
                  borderRadius="l"
                  padding="m"
                  marginTop="m"
                >
                  <Text variant="body2" color="primaryText">
                    {t('gov.proposals.toVote', {
                      maxChoicesPerVoter: proposal?.maxChoicesPerVoter,
                      choicesLength: proposal?.choices.length,
                    })}
                  </Text>
                  <Box marginTop="ms">
                    {showError && (
                      <Box flexDirection="row" paddingBottom="ms">
                        <Text variant="body3Medium" color="red500">
                          {showError}
                        </Text>
                      </Box>
                    )}
                    <Box flex={1} flexDirection="column" {...{ gap: 8 }}>
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
                backgroundColor="surfaceSecondary"
                borderRadius="l"
                padding="m"
                marginTop="m"
              >
                {!markdownLoading && markdown && (
                  <Markdown
                    style={{
                      hr: {
                        marginTop: theme.spacing.m,
                      },
                      blockquote: {
                        ...theme.textVariants.body2,
                        color: theme.colors.primaryText,
                        backgroundColor: 'transparent',
                      },
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
            </Box>
          </ScrollView>
        </SafeAreaBox>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default ProposalScreen
