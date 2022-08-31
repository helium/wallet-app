import React, { useCallback, useEffect, useMemo } from 'react'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { useOpacity } from '../../theme/themeHooks'
import AccountActivityFilter, {
  useActivityFilter,
} from './AccountActivityFilter'
import useActivityList from './useActivityList'
import Text from '../../components/Text'
import Box from '../../components/Box'
import { Activity } from '../../generated/graphql'
import TxnListItem from './TxnListItem'
import { useTransactionDetail } from './TransactionDetail'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

type Item = {
  item: Activity
  index: number
}

type Props = {
  snapPoints: number[]
}
const AccountActivitySheet = ({ snapPoints }: Props) => {
  const { t } = useTranslation()

  const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
  const { backgroundStyle: handleStyle } = useOpacity('black500', 1)

  const filterState = useActivityFilter()
  const { show: showTxnDetail } = useTransactionDetail()

  const { currentAccount } = useAccountStorage()

  const {
    data: activityData,
    error: activityError,
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useActivityList({
    address: currentAccount?.address,
    filter: filterState.filter,
  })

  useEffect(() => {
    if (!activityError) return

    if (activityError) {
      console.warn('activity', activityError)
    }
  }, [activityError])

  const footer = useMemo(() => {
    if (filterState.filter === 'all') {
      return (
        <Text
          variant="body1"
          color="surfaceSecondaryText"
          padding="l"
          textAlign="center"
        >
          {t('accountsScreen.allFilterFooter')}
        </Text>
      )
    }
    return null
  }, [filterState.filter, t])

  const renderSeparator = useCallback(() => {
    return <Box height={1} width="100%" backgroundColor="primaryBackground" />
  }, [])

  const keyExtractor = useCallback((item: Activity) => {
    return item.hash
  }, [])

  const requestMore = useCallback(() => {
    fetchMoreActivity()
  }, [fetchMoreActivity])

  const showTransactionDetail = useCallback(
    (item: Activity) => {
      showTxnDetail({
        item,
        accountAddress: currentAccount?.address || '',
      })
    },
    [currentAccount, showTxnDetail],
  )

  const renderFlatlistItem = useCallback(
    ({ item, index }: Item) => {
      const isLast = index === (activityData?.length || 0) - 1
      return (
        <TxnListItem
          onPress={showTransactionDetail}
          item={item}
          accountAddress={currentAccount?.address}
          now={now}
          isLast={isLast}
        />
      )
    },
    [activityData.length, currentAccount, now, showTransactionDetail],
  )

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleStyle}
      animateOnMount={false}
    >
      <AccountActivityFilter
        activityLoading={activityLoading}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...filterState}
      />
      <BottomSheetFlatList
        ListFooterComponent={footer}
        ItemSeparatorComponent={renderSeparator}
        data={activityData}
        renderItem={renderFlatlistItem}
        keyExtractor={keyExtractor}
        onEndReached={requestMore}
      />
    </BottomSheet>
  )
}

export default AccountActivitySheet
