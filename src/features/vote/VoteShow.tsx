/* eslint-disable react/jsx-props-no-spreading */
import Balance, { CurrencyType } from '@helium/currency'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { addMinutes, formatDistanceToNow } from 'date-fns'
import React, { memo as reactMemo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAsync } from 'react-async-hook'
import { orderBy } from 'lodash'
import { LayoutChangeEvent } from 'react-native'
import BackButton from '../../components/BackButton'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useAccountQuery, VoteOutcome } from '../../generated/graphql'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import animateTransition from '../../utils/animateTransition'
import { balanceToString } from '../../utils/Balance'
import {
  VoteNavigatorNavigationProp,
  VoteNavigatorStackParamList,
} from './voteNavigatorTypes'
import VoteOption from './VoteOption'
import VoteShowResult from './VoteShowResult'
import DateModule from '../../utils/DateModule'
import { locale } from '../../utils/i18n'
import { encodeMemoString } from '../../components/MemoInput'
import voteAccentColors from './voteAccentColors'

type Route = RouteProp<VoteNavigatorStackParamList, 'VoteShow'>
const VoteShow = () => {
  const {
    params: {
      vote: {
        tags: { primary, secondary },
        name,
        description,
        blocksRemaining,
        deadline,
      },
      voteResult: { timestamp, outcomes } = { timestamp: 0, outcomes: [] },
    },
  } = useRoute<Route>()
  const { t } = useTranslation()
  const navigation = useNavigation<VoteNavigatorNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
  })

  const [formattedTime, setFormattedTime] = useState('')
  const [outcomesTitleHeight, setOutcomesTitleHeight] = useState<number>()
  const [voteOutcome, setVoteOutcome] = useState<VoteOutcome>()

  const voteOpen = useMemo(() => blocksRemaining > 0, [blocksRemaining])

  const sortedOutcomes = useMemo(() => {
    if (!outcomes) return []

    const unsorted = outcomes.map((o, index) => ({
      color: voteAccentColors[index],
      ...o,
    }))
    return orderBy(unsorted, ['hntVoted'], ['desc'])
  }, [outcomes])

  const totalHntVoted = useMemo(
    () =>
      outcomes.reduce((prev, current) => prev + (current?.hntVoted || 0), 0),
    [outcomes],
  )

  const totalVotes = useMemo(
    () =>
      outcomes.reduce(
        (prev, current) => prev + (current?.uniqueWallets || 0),
        0,
      ),
    [outcomes],
  )

  useAsync(async () => {
    if (!voteOpen) {
      if (!timestamp) return

      const endDate = new Date(timestamp)
      const formatted = await DateModule.formatDate(
        endDate.toISOString(),
        'MM/dd/yy',
      )
      setFormattedTime(formatted)
      return
    }

    const deadlineDate = addMinutes(new Date(), blocksRemaining)
    setFormattedTime(formatDistanceToNow(deadlineDate))
  }, [timestamp, voteOpen, blocksRemaining])

  const handleToggle = useCallback(
    (vt: VoteOutcome) => () => {
      animateTransition('VoteShow.voteOutcomeChange')
      setVoteOutcome((prev) => {
        if (prev === vt) return undefined
        return vt
      })
    },
    [],
  )

  const handleOutcomesTitleLayout = useCallback((event: LayoutChangeEvent) => {
    setOutcomesTitleHeight(event.nativeEvent.layout.height)
  }, [])

  const handleVoteSelected = useCallback(() => {
    if (!voteOutcome || !currentAccount) return

    const index = outcomes.findIndex((v) => v === voteOutcome)

    // TODO: Is this memo right?
    const memo = encodeMemoString(index.toString()) || ''
    navigation.navigate('VoteBurn', {
      voteOutcome,
      account: currentAccount,
      memo,
    })
  }, [currentAccount, navigation, outcomes, voteOutcome])

  const accountHnt = useMemo(() => {
    if (!accountData?.account?.balance) return '0'
    return balanceToString(
      new Balance(accountData.account.balance, CurrencyType.networkToken),
      {
        maxDecimalPlaces: 2,
      },
    )
  }, [accountData])

  return (
    <ScrollView>
      <Box paddingBottom="xxxxl">
        <Box flexDirection="row" alignItems="center">
          <Box flex={1}>
            <BackButton paddingVertical="l" onPress={navigation.goBack} />
          </Box>
          <Text variant="regular" fontSize={19} color="primaryText">
            {t('vote.title')}
          </Text>
          <Box flex={1} />
        </Box>
        <Box marginHorizontal="lx">
          {(primary || secondary) && (
            <Box flexDirection="row" marginBottom="s">
              {primary && (
                <Box
                  backgroundColor="secondary"
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
                  backgroundColor="secondary"
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
            color="primaryText"
            maxWidth="75%"
          >
            {name}
          </Text>
          <Text variant="body2" color="secondaryText" marginVertical="s">
            {description}
          </Text>
        </Box>
        <Box
          backgroundColor="secondary"
          paddingHorizontal="lx"
          paddingVertical="ms"
          marginVertical="lm"
          justifyContent="space-between"
          flexDirection="row"
        >
          <Box>
            <Box
              height={outcomesTitleHeight}
              justifyContent="center"
              marginBottom="s"
            >
              <Text variant="body2" color="secondaryText" numberOfLines={2}>
                {voteOpen ? t('vote.deadline') : t('vote.votingClosedNewline')}
              </Text>
            </Box>
            <Text variant="body2" color="primaryText">
              {deadline.toLocaleString(locale)}
            </Text>
          </Box>
          <Box>
            <Box
              height={outcomesTitleHeight}
              justifyContent="center"
              marginBottom="s"
            >
              <Text
                variant="body2"
                color="secondaryText"
                numberOfLines={2}
                textAlign="center"
              >
                {voteOpen ? t('vote.blocksLeft') : t('vote.blocksSinceVote')}
              </Text>
            </Box>
            <Text variant="body2" color="primaryText" textAlign="center">
              {Math.abs(blocksRemaining).toLocaleString(locale)}
            </Text>
          </Box>
          <Box>
            <Box
              height={outcomesTitleHeight}
              justifyContent="center"
              marginBottom="s"
            >
              <Text
                variant="body2"
                color="secondaryText"
                numberOfLines={2}
                textAlign="center"
              >
                {voteOpen
                  ? t('vote.estimatedTimeRemainingNewline')
                  : t('vote.voteClosed')}
              </Text>
            </Box>
            <Text variant="body2" color="primaryText" textAlign="center">
              {formattedTime}
            </Text>
          </Box>
          <Box>
            <Box
              height={outcomesTitleHeight}
              justifyContent="center"
              marginBottom="s"
            >
              <Text
                variant="body2"
                color="secondaryText"
                numberOfLines={2}
                onLayout={handleOutcomesTitleLayout}
                textAlign="right"
              >
                {t('vote.totalVotes')}
              </Text>
            </Box>
            <Text variant="body2" color="primaryText" textAlign="right">
              {totalVotes.toLocaleString(locale)}
            </Text>
          </Box>
        </Box>
        <Box marginHorizontal="lx">
          {voteOpen && (
            <Box>
              <Text
                marginTop="s"
                marginLeft="s"
                variant="regular"
                fontSize={19}
                color="primaryText"
                maxWidth="75%"
              >
                {t('vote.voteOptions')}
              </Text>
              {outcomes.map((o, index) => (
                <VoteOption
                  key={o.address}
                  index={index}
                  toggleItem={handleToggle(o)}
                  value={o.value}
                  expanded={o.address === voteOutcome?.address}
                  alias={currentAccount?.alias || ' '}
                  hnt={accountHnt}
                  voteSelected={handleVoteSelected}
                />
              ))}
            </Box>
          )}
          <Text
            variant="body1"
            color="primaryText"
            maxWidth="75%"
            marginTop="l"
          >
            {voteOpen ? t('vote.preliminaryResults') : t('vote.finalResults')}
          </Text>
          {sortedOutcomes.map((o) => (
            <VoteShowResult key={o.address} {...o} totalVotes={totalHntVoted} />
          ))}
        </Box>
      </Box>
    </ScrollView>
  )
}

export default reactMemo(VoteShow)
