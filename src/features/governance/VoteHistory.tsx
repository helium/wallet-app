import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import { ProposalWithVotes } from '@helium/voter-stake-registry-sdk'
import { useProposalStatus } from '@hooks/useProposalStatus'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useColors } from '@theme/themeHooks'
import { getTimeFromNowFmt } from '@utils/dateTools'
import BN from 'bn.js'
import { times } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { VoterCardStat } from './VoterCardStat'
import ActiveCircle from '@assets/images/activeCircle.svg'
import CancelledCircle from '@assets/images/cancelledCircle.svg'
import { ProposalTags } from './ProposalTags'

export const VoteHistory: React.FC<{
  wallet: PublicKey
  header: React.ReactElement
}> = ({ wallet, header }) => {
  const { voteService } = useGovernance()
  const [voteHistories, setVoteHistory] = useState<ProposalWithVotes[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const dedupedVoteHistories = useMemo(() => {
    const seen = new Set()
    return (voteHistories || []).filter((p) => {
      const has = seen.has(p.name)
      seen.add(p.name)
      return !has
    })
  }, [voteHistories])

  const { execute: fetchMoreData, loading } = useAsyncCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    async (page: number) => {
      setPage(page)
      if (voteService) {
        const newVoteHistory = await voteService.getVotesForWallet({
          wallet,
          page,
          limit: 100,
        })
        if (newVoteHistory.length < 100) {
          setHasMore(false)
        }
        setVoteHistory((prev) => {
          const seen = new Set()
          return [...prev, ...newVoteHistory].filter((x) => {
            if (!seen.has(x.address)) {
              seen.add(x.address)
              return true
            }
            return false
          })
        })
      }
    },
  )

  const { t } = useTranslation()

  const refresh = useCallback(() => {
    setHasMore(true)
    setVoteHistory([])
    fetchMoreData(1)
  }, [fetchMoreData])
  useEffect(() => {
    if (voteService) {
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteService?.registrar.toBase58()])

  const renderEmptyComponent = useCallback(() => {
    if (!voteHistories) return null

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
  }, [voteHistories, loading, t])

  const renderItem = useCallback(({ item: proposal }) => {
    return <ProposalItem proposal={proposal} />
  }, [])

  const keyExtractor = useCallback(
    (item: ProposalWithVotes) => item.address,
    [],
  )

  const handleOnEndReached = useCallback(() => {
    if (!loading && hasMore) {
      fetchMoreData(page + 1)
    }
  }, [hasMore, fetchMoreData, loading, page])

  const { primaryText } = useColors()

  return (
    <FlatList
      ListHeaderComponent={() => header}
      keyExtractor={keyExtractor}
      data={dedupedVoteHistories}
      renderItem={renderItem}
      ListEmptyComponent={renderEmptyComponent}
      onEndReached={handleOnEndReached}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          title=""
          tintColor={primaryText}
        />
      }
    />
  )
}

const HISTORY_HEIGHT = 110

export const VoteHistorySkeleton = () => {
  return (
    <ReAnimatedBox entering={FadeIn} exiting={FadeOut}>
      <Box
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        height={HISTORY_HEIGHT}
        width="100%"
        justifyContent="center"
        alignItems="center"
        mb="m"
      >
        <CircleLoader loaderSize={30} />
      </Box>
    </ReAnimatedBox>
  )
}

const ProposalItem: React.FC<{
  proposal: ProposalWithVotes
}> = ({ proposal }) => {
  const { completed, timeExpired, endTs, votingResults, isCancelled } =
    useProposalStatus(proposal)
  const { t } = useTranslation()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const choices = proposal.state?.resolved?.choices

  return (
    <TouchableContainer
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      flexDirection="column"
      mb="m"
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
