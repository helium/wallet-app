import React, { useCallback, useMemo, useRef, useState } from 'react'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import BottomSheet, {
  BottomSheetFlatList,
  WINDOW_HEIGHT,
} from '@gorhom/bottom-sheet'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { Platform, View } from 'react-native'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import BackScreen from '../../components/BackScreen'
import Box from '../../components/Box'
import Text from '../../components/Text'
import ListItem from '../../components/ListItem'
import { Activity, TokenType, useAccountQuery } from '../../generated/graphql'
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
import BlurActionSheet from '../../components/BlurActionSheet'
import useLayoutHeight from '../../utils/useLayoutHeight'
import FadeInOut, { DelayedFadeIn } from '../../components/FadeInOut'
import AccountTokenBalance from './AccountTokenBalance'
import globalStyles from '../../theme/globalStyles'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useBackgroundStyle } from '../../theme/themeHooks'

const delayedAnimation = FadeIn.delay(300)

type Route = RouteProp<HomeStackParamList, 'AccountTokenScreen'>

const AccountTokenScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { currentAccount } = useAccountStorage()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [topHeaderHeight, setTopHeaderHeight] = useState(0)
  const [listHeight, setListHeight] = useLayoutHeight()
  const topHeaderRef = useRef<View>(null)
  const headerContainerRef = useRef<View>(null)
  const [topHeaderYPos, setTopHeaderYPos] = useState(0)
  const [headerContainerYPos, setHeaderContainerYPos] = useState(0)
  const listAnimatedPos = useSharedValue<number>(0)
  const listStyle = useBackgroundStyle('primaryBackground')

  const toggleFiltersOpen = useCallback(
    (open) => () => {
      setFiltersOpen(open)
    },
    [],
  )

  const { data: accountData } = useAccountQuery({
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
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useActivityList({
    address: currentAccount?.address,
    filter: filterState.filter,
  })

  const snapPoints = useMemo(() => {
    if (!topHeaderYPos || !headerContainerYPos) return

    const collapsed = WINDOW_HEIGHT - headerContainerYPos
    const expanded = WINDOW_HEIGHT - topHeaderYPos
    return [collapsed, expanded]
  }, [headerContainerYPos, topHeaderYPos])

  const canShowList = useMemo(() => snapPoints?.length === 2, [snapPoints])

  const topHeaderAnimatedStyle = useAnimatedStyle(() => {
    if (!snapPoints || !canShowList || listHeight !== snapPoints[1]) {
      return { opacity: 0 }
    }

    const expandedPosition = WINDOW_HEIGHT - snapPoints[1]
    const diff = listAnimatedPos.value - expandedPosition
    const o = diff / (snapPoints[1] - snapPoints[0])

    const offset = -1 * o * topHeaderHeight * 0.65
    return {
      opacity: 1 - o,
      transform: [{ translateY: offset }],
    }
  }, [snapPoints, topHeaderHeight, listHeight])

  const bottomHeaderAnimatedStyle = useAnimatedStyle(() => {
    if (!snapPoints || !canShowList || listHeight !== snapPoints[1]) {
      return { opacity: 1 }
    }

    const expandedPosition = WINDOW_HEIGHT - snapPoints[1]
    const diff = listAnimatedPos.value - expandedPosition
    const o = diff / (snapPoints[1] - snapPoints[0])

    return {
      opacity: o,
    }
  }, [snapPoints, topHeaderHeight, listHeight])

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

  const renderHeader = useCallback(() => {
    return (
      <Box
        backgroundColor="primaryBackground"
        paddingHorizontal="l"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        borderTopWidth={1}
        borderBottomWidth={1}
        borderBottomColor="secondaryText"
        borderTopColor="secondaryText"
        marginBottom="m"
      >
        <Text
          variant="body1"
          color="secondaryText"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {t(`accountsScreen.filterTypes.${filterState.filter}`)}
        </Text>
        <TouchableOpacityBox onPress={toggleFiltersOpen(true)}>
          <Text variant="body1" padding="ms" color="secondaryText">
            {t('accountsScreen.filter')}
          </Text>
        </TouchableOpacityBox>
      </Box>
    )
  }, [filterState.filter, t, toggleFiltersOpen])

  const keyExtractor = useCallback((item: Activity) => {
    return item.hash
  }, [])

  const renderItem = useCallback(
    ({ item, index }) => {
      const isLast = index === (activityData?.length || 0) - 1
      return (
        <FadeInOut>
          <Box paddingHorizontal="l" backgroundColor="primaryBackground">
            <TxnListItem
              onPress={showTransactionDetail}
              item={item}
              accountAddress={currentAccount?.address}
              now={now}
              isLast={isLast}
            />
          </Box>
        </FadeInOut>
      )
    },
    [currentAccount, activityData, now, showTransactionDetail],
  )

  const renderFooter = useCallback(() => {
    if (activityLoading) {
      return (
        <Box
          paddingVertical="l"
          paddingHorizontal="s"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
        >
          <Text
            variant="body1"
            color="surfaceSecondaryText"
            textAlign="center"
            maxFontSizeMultiplier={1.3}
          >
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
        <Text
          variant="body1"
          color="surfaceSecondaryText"
          textAlign="center"
          maxFontSizeMultiplier={1.3}
        >
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

  const backgroundComponent = useCallback(
    () => <Box backgroundColor="purpleHeart" flex={1} />,
    [],
  )

  const stickyHeaderIndices = useMemo(() => [0], [])

  const handleHeaderLayout = useCallback(() => {
    headerContainerRef.current?.measure((...args) => {
      const [, , , height, , pageY] = args
      if (!height || !pageY) return
      setHeaderContainerYPos(height + pageY)
    })
  }, [])

  const handleTopHeaderLayout = useCallback(() => {
    topHeaderRef.current?.measure((...args) => {
      const [, , , height, , pageY] = args

      if (!height || !pageY) return
      setTopHeaderYPos(height + pageY)
      setTopHeaderHeight(height)
    })
  }, [setTopHeaderHeight])

  return (
    <Animated.View entering={DelayedFadeIn} style={globalStyles.container}>
      <BackScreen
        padding="none"
        title={t('accountsScreen.title', {
          tokenType: route.params.tokenType.toUpperCase(),
        })}
      >
        <Box
          paddingHorizontal="l"
          ref={headerContainerRef}
          onLayout={handleHeaderLayout}
        >
          <Animated.View style={topHeaderAnimatedStyle}>
            <Box
              paddingTop="m"
              paddingBottom={Platform.OS === 'android' ? 'l' : 'm'}
              flexDirection="row"
              alignItems="center"
              onLayout={handleTopHeaderLayout}
              ref={topHeaderRef}
            >
              <Box flex={1}>
                <AccountTokenBalance
                  showTicker={false}
                  textVariant="h2"
                  justifyContent="flex-start"
                  accountData={accountData?.account}
                  tokenType={route.params.tokenType}
                  flex={1}
                />
                <AccountTokenCurrencyBalance
                  accountData={accountData?.account}
                  tokenType={route.params.tokenType}
                  variant="body1"
                  color="secondaryText"
                />
              </Box>
              <AccountActionBar tokenType={route.params.tokenType} compact />
            </Box>
          </Animated.View>
          <Animated.View style={bottomHeaderAnimatedStyle}>
            <Box marginVertical="xl">
              <Box alignItems="center" marginBottom="m">
                <TokenIcon tokenType={route.params.tokenType} size={50} />
              </Box>
              <AccountTokenBalance
                marginTop="s"
                accountData={accountData?.account}
                tokenType={route.params.tokenType}
              />
              <AccountTokenCurrencyBalance
                accountData={accountData?.account}
                tokenType={route.params.tokenType}
                variant="h4"
                color="secondaryText"
                textAlign="center"
                marginBottom="xl"
              />
              <AccountActionBar tokenType={route.params.tokenType} />
            </Box>
          </Animated.View>
          <Box height={topHeaderHeight} />
        </Box>
      </BackScreen>
      {!!canShowList && (
        <BottomSheet
          animateOnMount={false}
          snapPoints={snapPoints || []}
          backgroundComponent={backgroundComponent}
          animatedPosition={listAnimatedPos}
          handleComponent={null}
        >
          <Animated.View
            style={globalStyles.container}
            entering={delayedAnimation}
          >
            <BottomSheetFlatList
              onLayout={setListHeight}
              style={listStyle}
              keyExtractor={keyExtractor}
              directionalLockEnabled
              renderItem={renderItem}
              ListHeaderComponent={renderHeader}
              stickyHeaderIndices={stickyHeaderIndices}
              ListFooterComponent={renderFooter}
              onEndReached={fetchMoreActivity}
              data={filteredTxns}
              onEndReachedThreshold={0.01}
            />
          </Animated.View>
        </BottomSheet>
      )}

      {/* HACK FOR BACK GESTURE NOT WORKING ON IOS */}
      {Platform.OS === 'ios' && (
        <Box position="absolute" top={120} bottom={0} left={0} width={32} />
      )}

      <BlurActionSheet
        title={t('accountsScreen.filterTransactions')}
        open={filtersOpen}
        onClose={toggleFiltersOpen(false)}
      >
        {filters()}
      </BlurActionSheet>
    </Animated.View>
  )
}

export default withTransactionDetail(AccountTokenScreen)
