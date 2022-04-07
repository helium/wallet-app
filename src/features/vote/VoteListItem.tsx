import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { addMinutes, formatDistanceToNow } from 'date-fns'
import { orderBy } from 'lodash'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useVoteResultQuery, Vote, VoteResult } from '../../generated/graphql'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import voteAccentColors from './voteAccentColors'
import { locale } from '../../utils/i18n'

type Props = {
  index: number
  vote: Vote
  onPress: (vote: Vote, voteResult: VoteResult) => void
}
const VoteListItem = ({ index: _index, vote, onPress }: Props) => {
  const {
    tags: { primary, secondary },
    name,
    description,
    blocksRemaining,
  } = vote
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const { data: voteResultData } = useVoteResultQuery({
    variables: { address: currentAccount?.address || '', id: vote.id },
    skip: !currentAccount?.address,
  })

  const timeStr = useMemo(() => {
    if (blocksRemaining <= 0) return t('vote.votingClosed')
    const deadlineDate = addMinutes(new Date(), blocksRemaining)
    return formatDistanceToNow(deadlineDate)
  }, [blocksRemaining, t])

  const totalVotes = useMemo(() => {
    if (!voteResultData?.voteResult.outcomes) return ' '

    const {
      voteResult: { outcomes },
    } = voteResultData
    return outcomes
      .reduce((prev, current) => prev + (current?.uniqueWallets || 0), 0)
      .toLocaleString(locale)
  }, [voteResultData])

  const handleVoteSelected = useCallback(() => {
    if (!voteResultData?.voteResult) return
    onPress(vote, voteResultData.voteResult)
  }, [onPress, vote, voteResultData])

  const sortedOutcomes = useMemo(() => {
    const outcomes = voteResultData?.voteResult.outcomes
    if (!outcomes) return []

    const unsorted = outcomes.map((o, index) => ({
      color: voteAccentColors[index],
      ...o,
    }))
    return orderBy(unsorted, ['hntVoted'], ['desc'])
  }, [voteResultData])

  return (
    <TouchableOpacityBox
      onPress={handleVoteSelected}
      backgroundColor="secondary"
      marginBottom="m"
      marginHorizontal="lx"
      borderRadius="xl"
      padding="lm"
    >
      {(primary || secondary) && (
        <Box flexDirection="row" justifyContent="flex-end" marginBottom="s">
          {primary && (
            <Box
              backgroundColor="primaryBackground"
              borderRadius="s"
              paddingHorizontal="s"
              paddingVertical="xxs"
            >
              <Text variant="body2">{primary}</Text>
            </Box>
          )}
          {secondary && (
            <Box
              marginLeft={primary ? 's' : 'none'}
              backgroundColor="primaryBackground"
              paddingHorizontal="s"
              borderRadius="s"
              paddingVertical="xxs"
            >
              <Text variant="body2">{secondary}</Text>
            </Box>
          )}
        </Box>
      )}

      <Text
        marginTop="s"
        variant="regular"
        fontSize={19}
        maxWidth="75%"
        numberOfLines={2}
        adjustsFontSizeToFit
        color="primaryText"
      >
        {name}
      </Text>
      <Text
        variant="body2"
        color="secondaryText"
        numberOfLines={2}
        marginVertical="s"
      >
        {description}
      </Text>
      <Box flexDirection="row" justifyContent="space-between">
        <Text variant="body3" color="secondaryText" numberOfLines={2}>
          {t('vote.estimatedTimeRemaining')}
        </Text>
        <Text variant="body3" color="secondaryText" numberOfLines={2}>
          {t('vote.votes')}
        </Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between">
        <Text variant="body2" numberOfLines={2}>
          {timeStr}
        </Text>
        <Text variant="body2" numberOfLines={2}>
          {totalVotes}
        </Text>
      </Box>
      {sortedOutcomes && (
        <Box
          flexDirection="row"
          height={8}
          borderRadius="round"
          overflow="hidden"
          marginVertical="ms"
        >
          {sortedOutcomes.map((o) => (
            <Box
              key={o.value}
              flex={o.hntVoted || 0}
              backgroundColor={o.color}
            />
          ))}
        </Box>
      )}
    </TouchableOpacityBox>
  )
}

export default memo(VoteListItem)
