import ActiveCircle from '@assets/images/activeCircle.svg'
import CancelledCircle from '@assets/images/cancelledCircle.svg'
import Box from '@components/Box'
import { CardSkeleton } from '@components/CardSkeleton'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import { votesForWalletQuery } from '@helium/voter-stake-registry-hooks'
import { ProposalWithVotes } from '@helium/voter-stake-registry-sdk'
import { useProposalStatus } from '@hooks/useProposalStatus'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useColors } from '@theme/themeHooks'
import { getTimeFromNowFmt } from '@utils/dateTools'
import BN from 'bn.js'
import { times } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl } from 'react-native'
import { ProposalTags } from './ProposalTags'
import { VoterCardStat } from './VoterCardStat'
import { GovernanceNavigationProp } from './governanceTypes'

export const VoteHistory: React.FC<{
  wallet: PublicKey
  header: React.ReactElement
  onRefresh?: () => void
}> = ({ wallet, header, onRefresh = () => {} }) => {
  const { voteService } = useGovernance()

  const {
    data: voteHistoryPages,
    fetchNextPage,
    hasNextPage,
    refetch,
    isLoading: loading,
  } = useInfiniteQuery(
    votesForWalletQuery({
      voteService,
      wallet,
      amountPerPage: 20,
    }),
  )
  const handleRefresh = useCallback(() => {
    refetch()
    onRefresh()
  }, [onRefresh, refetch])

  const dedupedVoteHistories = useMemo(() => {
    const seen = new Set()
    return (voteHistoryPages?.pages?.flat() || []).filter((p) => {
      const has = seen.has(p.name)
      seen.add(p.name)
      return !has
    })
  }, [voteHistoryPages])

  const { t } = useTranslation()

  const renderEmptyComponent = useCallback(() => {
    if (!voteHistoryPages) return null

    if (loading) {
      return (
        <Box flex={1} flexDirection="column">
          {times(5).map((i) => (
            <VoteHistorySkeleton key={i} />
          ))}
        </Box>
      )
    }

    return (
      <Box
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        height={HISTORY_HEIGHT}
        width="100%"
        justifyContent="center"
        alignItems="center"
        mb="m"
      >
        <Text variant="body1" color="white">
          {t('gov.history.noneFound')}
        </Text>
      </Box>
    )
  }, [voteHistoryPages, loading, t])

  const renderItem = useCallback(({ item: proposal }) => {
    return <ProposalItem proposal={proposal} />
  }, [])

  const keyExtractor = useCallback(
    (item: ProposalWithVotes) => item.address,
    [],
  )

  const handleOnEndReached = useCallback(() => {
    if (!loading && hasNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, loading])

  const { primaryText } = useColors()

  return (
    <FlatList
      ListHeaderComponent={header}
      keyExtractor={keyExtractor}
      data={dedupedVoteHistories}
      renderItem={renderItem}
      ListEmptyComponent={renderEmptyComponent}
      onEndReached={handleOnEndReached}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={handleRefresh}
          title=""
          tintColor={primaryText}
        />
      }
    />
  )
}

const HISTORY_HEIGHT = 110

export const VoteHistorySkeleton = () => {
  return <CardSkeleton height={HISTORY_HEIGHT} />
}

const ProposalItem: React.FC<{
  proposal: ProposalWithVotes
}> = ({ proposal }) => {
  const { completed, timeExpired, endTs, votingResults, isCancelled } =
    useProposalStatus(proposal)
  const { t } = useTranslation()
  const { mint } = useGovernance()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const choices = proposal.state?.resolved?.choices
  const navigation = useNavigation<GovernanceNavigationProp>()
  const handlePress = useCallback(() => {
    navigation.navigate('ProposalScreen', {
      mint: mint.toBase58(),
      proposal: proposal.address,
    })
  }, [mint, navigation, proposal.address])

  return (
    <TouchableContainer
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      flexDirection="column"
      mb="m"
      onPress={handlePress}
    >
      <Box
        px="m"
        pt="s"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <ProposalTags tags={proposal?.tags} />
        <Box flexDirection="row">
          {!completed ? (
            <Pill
              iconProps={{ width: 8, height: 8 }}
              Icon={ActiveCircle}
              color="black"
              textProps={{ variant: 'body3' }}
              text={t('gov.history.active')}
            />
          ) : null}
          {isCancelled ? (
            <Pill
              iconProps={{ width: 8, height: 8 }}
              Icon={CancelledCircle}
              color="black"
              textProps={{ variant: 'body3' }}
              text={t('gov.history.cancelled')}
            />
          ) : null}
        </Box>
      </Box>
      <Box
        px="m"
        pb="m"
        mb="s"
        borderBottomColor="dividerGrey"
        borderBottomWidth={1}
      >
        <Text variant="body1">{proposal.name}</Text>
      </Box>
      {timeExpired ? (
        <Box
          px="m"
          width="100%"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <VoterCardStat
            title={t('gov.history.completed')}
            value={new Date(
              (endTs?.toNumber() || 0) * 1000,
            ).toLocaleDateString()}
          />
          <VoterCardStat
            title={t('gov.history.result')}
            value={
              choices
                ? Object.values(choices)
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    .map((c: number) => proposal.choices[c].name)
                    .join(', ')
                : ''
            }
          />
        </Box>
      ) : null}
      <Box
        px="m"
        width="100%"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        {proposal.votes[0].weight ? (
          <>
            <VoterCardStat
              title={t('gov.history.voted')}
              value={proposal.votes.map((v) => v.choiceName).join(', ')}
            />
            <VoterCardStat
              title={t('gov.history.percentOfVote')}
              value={
                // Calc with 4 decimals precision
                proposal.votes[0].weight
                  ? `${(
                      new BN(proposal.votes[0].weight)
                        .mul(new BN(10000))
                        .div(votingResults.totalVotes)
                        .toNumber() / 100
                    ).toString()}%`
                  : ''
              }
            />
          </>
        ) : (
          <Pill color="orange" text={t('gov.history.notVoted')} />
        )}
      </Box>
      <Box px="m">
        {!timeExpired && (
          <VoterCardStat
            title={t('gov.history.estTimeRemaining')}
            value={getTimeFromNowFmt(endTs || new BN(0))}
          />
        )}
      </Box>
    </TouchableContainer>
  )
}
