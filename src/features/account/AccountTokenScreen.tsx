import React, { useCallback, useMemo, useState } from 'react'
import { SectionList } from 'react-native'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import BackScreen from '../../components/BackScreen'
import Box from '../../components/Box'
import Text from '../../components/Text'
import ListItem from '../../components/ListItem'
import {
  AccountData,
  Activity,
  TokenType,
  useAccountQuery,
} from '../../generated/graphql'
import { useAccountBalances } from '../../utils/Balance'
import TokenIcon from './TokenIcon'
import AccountActionBar from './AccountActionBar'
import useActivityList from './useActivityList'
import { FilterType, useActivityFilter } from './AccountActivityFilter'
import TxnListItem from './TxnListItem'
import {
  useTransactionDetail,
  withTransactionDetail,
} from './TransactionDetail'
import { HomeStackParamList } from '../home/homeTypes'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import FabButton from '../../components/FabButton'
import BlurActionSheet from '../../components/BlurActionSheet'

type Route = RouteProp<HomeStackParamList, 'AccountTokenScreen'>

const AccountTokenScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { currentAccount } = useAccountStorage()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleFiltersOpen = useCallback(
    (open) => () => {
      setFiltersOpen(open)
    },
    [],
  )

  const {
    data: accountData,
    // error: accountsError
  } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
    pollInterval: 30000,
    // TODO: adjust this interval if needed
  })

  const filterState = useActivityFilter()

  const {
    data: activityData,
    // error: activityError,
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useActivityList({
    address: currentAccount?.address,
    filter: filterState.filter,
  })

  const filteredTxns = useMemo(() => {
    if (filterState.filter === 'payment') {
      return activityData.filter(
        (txn) =>
          txn.payments &&
          txn.payments.some((p) =>
            route.params.tokenType === TokenType.Hnt
              ? !p.tokenType || p.tokenType === TokenType.Hnt
              : p.tokenType === route.params.tokenType,
          ),
      )
    }

    return activityData.filter((txn: Activity) =>
      route.params.tokenType === TokenType.Hnt
        ? !txn.tokenType || txn.tokenType === TokenType.Hnt
        : txn.tokenType === route.params.tokenType,
    )
  }, [activityData, filterState.filter, route.params.tokenType])

  const { show: showTxnDetail } = useTransactionDetail()

  const showTransactionDetail = useCallback(
    (item: Activity) => {
      showTxnDetail({
        item,
        accountAddress: currentAccount?.address || '',
      })
    },
    [currentAccount, showTxnDetail],
  )

  const renderSectionHeader = useCallback(() => {
    return (
      <Box
        backgroundColor="primaryBackground"
        paddingHorizontal="m"
        paddingBottom="s"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text variant="h4" color="white" numberOfLines={1} adjustsFontSizeToFit>
          {t(`accountsScreen.filterTypes.${filterState.filter}`)}
        </Text>
        <FabButton
          icon="filter"
          size={40}
          iconColor="white"
          backgroundColor="surface"
          backgroundColorOpacity={0}
          backgroundColorOpacityPressed={0.4}
          onPress={toggleFiltersOpen(true)}
        />
      </Box>
    )
  }, [filterState, t, toggleFiltersOpen])

  const keyExtractor = useCallback((item: Activity) => {
    return item.hash
  }, [])

  const renderItem = useCallback(
    ({ item, index }) => {
      const isLast = index === (activityData?.length || 0) - 1
      return (
        <Box paddingHorizontal="m">
          <TxnListItem
            onPress={showTransactionDetail}
            item={item}
            accountAddress={currentAccount?.address}
            now={now}
            isLast={isLast}
          />
        </Box>
      )
    },
    [currentAccount, activityData, now, showTransactionDetail],
  )

  const renderSectionFooter = useCallback(() => {
    if (activityLoading) {
      return (
        <Box
          paddingVertical="m"
          paddingHorizontal="s"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
        >
          <Text variant="body1" color="surfaceSecondaryText" textAlign="center">
            {t('generic.loading')}
          </Text>
        </Box>
      )
    }

    return (
      <Box
        backgroundColor="primaryBackground"
        paddingVertical="m"
        paddingHorizontal="s"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
      >
        <Text variant="body1" color="surfaceSecondaryText" textAlign="center">
          {t('accountsScreen.allFilterFooter')}
        </Text>
      </Box>
    )
  }, [activityLoading, t])

  const setFilter = useCallback(
    (filterType: FilterType) => () => {
      setFiltersOpen(false)
      filterState.change(filterType)
    },
    [filterState],
  )

  const filters = useCallback(
    () => (
      <>
        <ListItem
          key="all"
          title={t('accountsScreen.filterTypes.all')}
          selected={filterState.filter === 'all'}
          onPress={setFilter('all')}
        />
        <ListItem
          key="payment"
          title={t('accountsScreen.filterTypes.payment')}
          onPress={setFilter('payment')}
          selected={filterState.filter === 'payment'}
        />
        <ListItem
          key="mining"
          title={t('accountsScreen.filterTypes.mining')}
          onPress={setFilter('mining')}
          selected={filterState.filter === 'mining'}
        />
        {route.params.tokenType === TokenType.Hnt && (
          <>
            <ListItem
              key="burn"
              title={t('accountsScreen.filterTypes.burn')}
              onPress={setFilter('burn')}
              selected={filterState.filter === 'burn'}
            />
            <ListItem
              key="hotspotAndValidators"
              title={t('accountsScreen.filterTypes.hotspotAndValidators')}
              onPress={setFilter('hotspotAndValidators')}
              selected={filterState.filter === 'hotspotAndValidators'}
            />
            <ListItem
              key="pending"
              title={t('accountsScreen.filterTypes.pending')}
              onPress={setFilter('pending')}
              selected={filterState.filter === 'pending'}
            />
          </>
        )}
      </>
    ),
    [filterState, route.params.tokenType, setFilter, t],
  )

  return (
    <>
      <BackScreen padding="none">
        <SectionList
          ListHeaderComponent={
            <>
              <Box alignItems="center" marginTop="xxl" marginBottom="m">
                <TokenIcon tokenType={route.params.tokenType} size={50} />
              </Box>
              <AccountTokenBalance
                accountData={accountData?.account}
                tokenType={route.params.tokenType}
              />
              <AccountTokenCurrencyBalance
                accountData={accountData?.account}
                tokenType={route.params.tokenType}
                variant="h4"
                color="secondaryText"
                textAlign="center"
              />
              <AccountActionBar
                accountData={accountData?.account}
                tokenType={route.params.tokenType}
              />
            </>
          }
          sections={[
            { title: t('accountsScreen.activity'), data: filteredTxns },
          ]}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onEndReached={fetchMoreActivity}
          onEndReachedThreshold={0.01}
        />
      </BackScreen>
      <BlurActionSheet
        title={t('accountsScreen.filterTransactions')}
        open={filtersOpen}
        onClose={toggleFiltersOpen(false)}
      >
        {filters()}
      </BlurActionSheet>
    </>
  )
}

const AccountTokenBalance = ({
  accountData,
  tokenType,
}: {
  accountData?: AccountData | null
  tokenType: TokenType
}) => {
  const balances = useAccountBalances(accountData)

  const balance = useMemo(() => {
    switch (tokenType) {
      default:
      case TokenType.Hnt:
        return balances?.hnt.toString(2)
      case TokenType.Mobile:
        return balances?.mobile.toString(2)
      case TokenType.Dc:
        return balances?.dc.toString(2)
      case TokenType.Hst:
        return balances?.hst.toString(2)
    }
  }, [balances, tokenType])

  return (
    <Text
      variant="h0"
      color="primaryText"
      numberOfLines={1}
      adjustsFontSizeToFit
      marginHorizontal="m"
      textAlign="center"
    >
      {balance}
    </Text>
  )
}

export default withTransactionDetail(AccountTokenScreen)
