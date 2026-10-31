import ActiveCircle from '@assets/images/activeCircle.svg'
import CancelledCircle from '@assets/images/cancelledCircle.svg'
import { CardSkeleton } from '@components/CardSkeleton'
import { Pill } from '@components/Pill'
import { votesForWalletQuery } from '@helium/voter-stake-registry-hooks'
import { ProposalWithVotes } from '@helium/voter-stake-registry-sdk'
import { useProposalStatus } from '@hooks/useProposalStatus'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useInfiniteQuery } from '@tanstack/react-query'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { getTimeFromNowFmt } from '@utils/dateTools'
import BN from 'bn.js'
import { times } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { ProposalTags } from './ProposalTags'
import { ProxyCardStat } from './ProxyCardStat'
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
    void refetch()
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
        <View className="flex-1 flex-col">
          {times(5).map((i) => (
            <VoteHistorySkeleton key={i} />
          ))}
        </View>
      )
    }

    return (
      <View
        className="mb-4 w-full items-center justify-center rounded-[12px] bg-secondary"
        style={{ height: HISTORY_HEIGHT }}
      >
        <Text size="base">{t('gov.history.noneFound')}</Text>
      </View>
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
      void fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, loading])

  const foreground = useCSSVariable('--color-foreground')

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
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
          tintColor={typeof foreground === 'string' ? foreground : undefined}
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
    navigation.navigate(
      'ProposalScreen',
      { mint: mint.toBase58(), proposal: proposal.address },
      { pop: true },
    )
  }, [mint, navigation, proposal.address])

  return (
    <PressableScale
      className="mb-4 flex-col rounded-[12px] bg-secondary"
      onPress={handlePress}
    >
      <View className="flex-row items-center justify-between px-4 pt-2">
        <ProposalTags tags={proposal?.tags} />
        <View className="flex-row">
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
        </View>
      </View>
      <View className="mb-2 border-b border-border px-4 pb-4">
        <Text size="base">{proposal.name}</Text>
      </View>
      {timeExpired ? (
        <View className="w-full flex-row items-center justify-between px-4">
          <ProxyCardStat
            title={t('gov.history.completed')}
            value={new Date(
              (endTs?.toNumber() || 0) * 1000,
            ).toLocaleDateString()}
          />
          <ProxyCardStat
            title={t('gov.history.result')}
            className="items-end"
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
        </View>
      ) : null}
      <View className="px-4">
        {!timeExpired && (
          <ProxyCardStat
            title={t('gov.history.estTimeRemaining')}
            value={getTimeFromNowFmt(endTs || new BN(0))}
          />
        )}
      </View>
      <View className="w-full flex-row items-center justify-between px-4 pb-2">
        {proposal.votes[0].weight ? (
          <>
            <ProxyCardStat
              title={t('gov.history.voted')}
              value={proposal.votes.map((v) => v.choiceName).join(', ')}
            />
            <ProxyCardStat
              title={t('gov.history.percentOfVote')}
              className="items-end"
              value={
                // Calc with 4 decimals precision
                proposal.votes[0].weight && !votingResults?.totalVotes.isZero()
                  ? `${(
                      (BN.isBN(proposal.votes[0].weight)
                        ? proposal.votes[0].weight
                        : new BN(proposal.votes[0].weight.toString())
                      )
                        .mul(new BN(10000))
                        .div(votingResults.totalVotes)
                        .toNumber() / 100
                    ).toString()}%`
                  : ''
              }
            />
          </>
        ) : (
          <View className="mt-2 w-full flex-row items-center justify-center">
            <Pill color="orange" text={t('gov.history.notVoted')} />
          </View>
        )}
      </View>
    </PressableScale>
  )
}
