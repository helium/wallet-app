import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import Balance, { CurrencyType, DataCredits } from '@helium/currency'
import BackButton from '../../components/BackButton'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TextTransform from '../../components/TextTransform'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useVotesQuery, Vote, VoteResult } from '../../generated/graphql'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { VoteNavigatorNavigationProp } from './voteNavigatorTypes'
import VoteListItem from './VoteListItem'
import { balanceToString } from '../../utils/Balance'
import {
  EMPTY_B58_ADDRESS,
  useTransactions,
} from '../../storage/TransactionProvider'
import { encodeMemoString } from '../../components/MemoInput'

const VoteList = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<VoteNavigatorNavigationProp>()
  const [filter, setFilter] = useState<'active' | 'closed'>('active')
  const { currentAccount } = useAccountStorage()
  const { data: voteData } = useVotesQuery({
    variables: { address: currentAccount?.address || '' },
    skip: !currentAccount?.address,
  })
  const [fee, setFee] = useState<Balance<DataCredits>>()
  const { makeBurnTxn } = useTransactions()

  const updateFilter = useCallback(
    (next: 'active' | 'closed') => () => setFilter(next),
    [],
  )

  useEffect(() => {
    makeBurnTxn({
      payeeB58: EMPTY_B58_ADDRESS.b58,
      amount: 0,
      memo: encodeMemoString('1') || '',
      nonce: 1,
    }).then((b) =>
      setFee(new Balance(b.unsignedTxn.fee, CurrencyType.dataCredit)),
    )
  }, [makeBurnTxn])

  const handleItemSelected = useCallback(
    (vote: Vote, voteResult: VoteResult) => {
      navigation.navigate('VoteShow', { vote, voteResult })
    },
    [navigation],
  )

  const listData = useMemo(
    (): Vote[] => voteData?.votes[filter] || [],
    [filter, voteData],
  )

  const keyExtractor = useCallback((item: Vote) => item.id, [])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item }: { index: number; item: Vote }) => {
      return (
        <VoteListItem vote={item} index={index} onPress={handleItemSelected} />
      )
    },
    [handleItemSelected],
  )

  const header = useMemo(() => {
    return (
      <Box>
        <Box
          marginVertical="m"
          flexDirection="row"
          borderRadius="round"
          overflow="hidden"
          marginHorizontal="xxl"
        >
          <TouchableOpacityBox
            onPress={updateFilter('active')}
            flex={1}
            paddingVertical="s"
            backgroundColor={
              filter === 'active' ? 'surfaceContrast' : 'surfaceSecondary'
            }
          >
            <Text
              variant="regular"
              fontSize={19}
              textAlign="center"
              color={
                filter === 'active'
                  ? 'surfaceContrastText'
                  : 'surfaceSecondaryText'
              }
            >
              {t('vote.active')}
            </Text>
          </TouchableOpacityBox>
          <Box width={2} backgroundColor="primaryBackground" />
          <TouchableOpacityBox
            onPress={updateFilter('closed')}
            flex={1}
            paddingVertical="s"
            backgroundColor={
              filter === 'closed' ? 'surfaceContrast' : 'surfaceSecondary'
            }
          >
            <Text
              variant="regular"
              fontSize={19}
              textAlign="center"
              color={
                filter === 'closed'
                  ? 'surfaceContrastText'
                  : 'surfaceSecondaryText'
              }
            >
              {t('vote.closed')}
            </Text>
          </TouchableOpacityBox>
        </Box>

        {filter === 'active' && (
          <>
            <TextTransform
              variant="regular"
              fontSize={19}
              colorTextVariant="bold"
              color="primaryText"
              marginTop="m"
              marginHorizontal="xxl"
              i18nKey={t('vote.subtitle')}
            />
            <Text
              variant="body2"
              color="secondaryText"
              marginHorizontal="xxl"
              marginVertical="m"
            >
              {t('vote.body', {
                dcValue: balanceToString(fee),
                usdValue: balanceToString(fee?.toUsd(), {
                  maxDecimalPlaces: 2,
                }),
              })}
            </Text>
          </>
        )}
      </Box>
    )
  }, [fee, filter, t, updateFilter])

  return (
    <Box flex={1}>
      <Box flexDirection="row" alignItems="center">
        <Box flex={1}>
          <BackButton paddingVertical="l" onPress={navigation.goBack} />
        </Box>
        <Text variant="regular" fontSize={19} color="primaryText">
          {t('vote.title')}
        </Text>
        <Box flex={1} />
      </Box>
      <FlatList
        ListHeaderComponent={header}
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </Box>
  )
}

export default memo(VoteList)
