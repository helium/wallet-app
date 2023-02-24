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
import { Ticker } from '@helium/currency'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import BackScreen from '../../components/BackScreen'
import Box from '../../components/Box'
import Text from '../../components/Text'
import ListItem from '../../components/ListItem'
import TokenIcon from '../../components/TokenIcon'
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
import useLayoutHeight from '../../hooks/useLayoutHeight'
import FadeInOut, { DelayedFadeIn } from '../../components/FadeInOut'
import AccountTokenBalance from './AccountTokenBalance'
import globalStyles from '../../theme/globalStyles'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors } from '../../theme/themeHooks'
import { useAppStorage } from '../../storage/AppStorageProvider'
import ActivityIndicator from '../../components/ActivityIndicator'
import { Activity } from '../../types/activity'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import { NavBarHeight } from '../../components/NavBar'

const delayedAnimation = FadeIn.delay(300)

type Route = RouteProp<HomeStackParamList, 'AccountTokenScreen'>

const AccountTokenScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { currentAccount } = useAccountStorage()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [topHeaderHeight, setTopHeaderHeight] = useState(0)
  const [listHeight, setListHeight] = useLayoutHeight()
  const [bottomScreenHeaderHeight, setBottomScreenHeaderHeight] =
    useLayoutHeight()
  const [backHeaderHeight, setBackHeaderHeight] = useLayoutHeight()
  const topHeaderRef = useRef<View>(null)
  const headerContainerRef = useRef<View>(null)
  const [topHeaderYPos, setTopHeaderYPos] = useState(0)
  const [headerContainerYPos, setHeaderContainerYPos] = useState(0)
  const listAnimatedPos = useSharedValue<number>(0)
  const { l1Network } = useAppStorage()
  const insets = useSafeAreaInsets()
  const colors = useColors()

  const routeTicker = useMemo(
    () => route.params.tokenType?.toUpperCase() as Ticker,
    [route.params.tokenType],
  )

  const toggleFiltersOpen = useCallback(
    (open) => () => {
      setFiltersOpen(open)
    },
    [],
  )

  const listStyle = useMemo(() => {
    return {
      backgroundColor: colors.primaryBackground,
    }
  }, [colors])

  const filterState = useActivityFilter()

  const {
    data: activityData,
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useActivityList({
    account: currentAccount,
    filter: filterState.filter,
    ticker: routeTicker,
  })

  const actualHeight = useMemo(() => {
    if (l1Network === 'helium') return WINDOW_HEIGHT
    return WINDOW_HEIGHT - insets.bottom - NavBarHeight
  }, [insets.bottom, l1Network])

  const snapPoints = useMemo(() => {
    if (!topHeaderYPos || !headerContainerYPos) return
    const collapsed = actualHeight - headerContainerYPos
    const expanded = actualHeight
      ? actualHeight - insets.top - backHeaderHeight - topHeaderHeight
      : 0
    return [collapsed, expanded]
  }, [
    actualHeight,
    backHeaderHeight,
    headerContainerYPos,
    insets.top,
    topHeaderHeight,
    topHeaderYPos,
  ])

  const canShowList = useMemo(() => snapPoints?.length === 2, [snapPoints])

  const topHeaderAnimatedStyle = useAnimatedStyle(() => {
    if (!snapPoints || !canShowList) {
      return { opacity: 0 }
    }

    const o =
      (listAnimatedPos.value - insets.top - topHeaderHeight) /
      (snapPoints[1] - snapPoints[0])

    return {
      opacity: 1 - o,
      position: 'absolute',
      left: 0,
      right: 0,
    }
  }, [snapPoints, topHeaderHeight, listHeight])

  const bottomHeaderAnimatedStyle = useAnimatedStyle(() => {
    if (!snapPoints || !canShowList) {
      return { opacity: 1 }
    }

    const expandedPosition = actualHeight - snapPoints[1]
    const diff = listAnimatedPos.value - expandedPosition
    const o = diff / (snapPoints[1] - snapPoints[0])

    return {
      opacity: o,
    }
  }, [snapPoints, topHeaderHeight, listHeight])

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
    const filterName = t(`accountsScreen.filterTypes.${filterState.filter}`)
    const postFix = l1Network === 'helium' ? ' (24h)' : ''

    return (
      <Box
        onLayout={setBottomScreenHeaderHeight}
        position="absolute"
        top={0}
        left={0}
        right={0}
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
          {filterName + postFix}
        </Text>
        <TouchableOpacityBox onPress={toggleFiltersOpen(true)}>
          <Text variant="body1" padding="ms" color="secondaryText">
            {t('accountsScreen.filter')}
          </Text>
        </TouchableOpacityBox>
      </Box>
    )
  }, [
    filterState.filter,
    l1Network,
    setBottomScreenHeaderHeight,
    t,
    toggleFiltersOpen,
  ])

  const keyExtractor = useCallback((item: Activity) => {
    return item.hash
  }, [])

  const renderItem = useCallback(
    ({ item, index }) => {
      const isFirst = index === 0
      const isLast = index === (activityData?.length || 0) - 1
      return (
        <FadeInOut>
          <Box
            paddingHorizontal="l"
            backgroundColor="primaryBackground"
            style={{
              marginTop: isFirst ? bottomScreenHeaderHeight : 0,
            }}
          >
            <TxnListItem
              onPress={showTransactionDetail}
              item={item}
              now={now}
              isLast={isLast}
            />
          </Box>
        </FadeInOut>
      )
    },
    [activityData, bottomScreenHeaderHeight, now, showTransactionDetail],
  )

  const renderFooter = useCallback(() => {
    if (l1Network === 'helium' && !activityLoading) {
      return (
        <Box
          backgroundColor="primaryBackground"
          paddingVertical="m"
          paddingHorizontal="s"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          style={{
            marginTop: activityData?.length > 0 ? 0 : bottomScreenHeaderHeight,
          }}
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
    }

    return (
      <Box
        paddingVertical="l"
        paddingHorizontal="s"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
      >
        <ActivityIndicator animating={activityLoading} />
      </Box>
    )
  }, [activityData, activityLoading, bottomScreenHeaderHeight, l1Network, t])

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
        {routeTicker !== 'DC' && (
          <>
            <ListItem
              key="all"
              title={`${t('accountsScreen.filterTypes.all')}${
                l1Network === 'helium' ? ' (24h)' : ''
              }`}
              selected={filterState.filter === 'all'}
              onPress={setFilter('all')}
              hasPressedState={false}
            />
            <ListItem
              key="payment"
              title={t('accountsScreen.filterTypes.payment')}
              onPress={setFilter('payment')}
              selected={filterState.filter === 'payment'}
              hasPressedState={false}
            />
            <ListItem
              key="mining"
              title={t('accountsScreen.filterTypes.mining')}
              onPress={setFilter('mining')}
              selected={filterState.filter === 'mining'}
              hasPressedState={false}
            />
          </>
        )}
        {routeTicker === 'DC' && (
          <>
            <ListItem
              key="mint"
              title={t('accountsScreen.filterTypes.mint')}
              onPress={setFilter('mint')}
              selected={filterState.filter === 'mint'}
              hasPressedState={false}
            />
            <ListItem
              key="delegate"
              title={t('accountsScreen.filterTypes.delegate')}
              onPress={setFilter('delegate')}
              selected={filterState.filter === 'delegate'}
              hasPressedState={false}
            />
          </>
        )}
        {routeTicker === 'HNT' && (
          <>
            <ListItem
              key="burn"
              title={t('accountsScreen.filterTypes.burn')}
              onPress={setFilter('burn')}
              selected={filterState.filter === 'burn'}
              hasPressedState={false}
            />
            <ListItem
              key="hotspotAndValidators"
              title={t('accountsScreen.filterTypes.hotspotAndValidators')}
              onPress={setFilter('hotspotAndValidators')}
              selected={filterState.filter === 'hotspotAndValidators'}
              hasPressedState={false}
            />
            <ListItem
              key="pending"
              title={t('accountsScreen.filterTypes.pending')}
              onPress={setFilter('pending')}
              selected={filterState.filter === 'pending'}
              hasPressedState={false}
            />
          </>
        )}
      </>
    ),
    [filterState.filter, l1Network, routeTicker, setFilter, t],
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

  const actionBarProps = useMemo(() => {
    let options = {
      hasSend: true,
      hasRequest: true,
      hasDelegate: false,
      compact: true,
      hasBottomTitle: true,
    }

    if (routeTicker === 'DC') {
      options = {
        hasSend: false,
        hasRequest: false,
        hasDelegate: true,
        compact: false,
        hasBottomTitle: false,
      }
    }

    return options
  }, [routeTicker])

  const tokenDetails = useMemo(() => {
    if (routeTicker !== 'DC') return

    return (
      <Box>
        <Text variant="body1" color="secondaryText" textAlign="center">
          {t('accountsScreen.receivedBalance', {
            amount: 0,
          })}
        </Text>
        <Text variant="body1" color="secondaryText" textAlign="center">
          {t('accountsScreen.delegatedBalance', {
            amount: 0,
          })}
        </Text>
      </Box>
    )
  }, [routeTicker, t])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <BackScreen
        padding="none"
        title={t('accountsScreen.title', {
          ticker: routeTicker,
        })}
        onHeaderLayout={setBackHeaderHeight}
      >
        <Box
          paddingHorizontal="l"
          ref={headerContainerRef}
          onLayout={handleHeaderLayout}
          justifyContent="center"
        >
          <Animated.View style={topHeaderAnimatedStyle}>
            <Box
              paddingTop="m"
              paddingBottom={Platform.OS === 'android' ? 'l' : 'm'}
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              onLayout={handleTopHeaderLayout}
              ref={topHeaderRef}
            >
              <Box flex={1}>
                <AccountTokenBalance
                  showTicker={false}
                  textVariant="h2Medium"
                  justifyContent="flex-start"
                  ticker={routeTicker}
                  flex={1}
                />
                <AccountTokenCurrencyBalance
                  ticker={routeTicker}
                  variant="body1"
                  color="secondaryText"
                />
              </Box>
              <AccountActionBar
                hasSend={actionBarProps.hasSend}
                hasRequest={actionBarProps.hasRequest}
                hasDelegate={actionBarProps.hasDelegate}
                ticker={routeTicker}
                maxCompact
              />
            </Box>
          </Animated.View>
          <Animated.View style={bottomHeaderAnimatedStyle}>
            <Box marginVertical="xl">
              <Box alignItems="center" marginBottom="m">
                <TokenIcon ticker={routeTicker} size={50} />
              </Box>
              <AccountTokenBalance marginTop="s" ticker={routeTicker} />
              {tokenDetails}
              <AccountTokenCurrencyBalance
                ticker={routeTicker}
                variant="h4"
                color="secondaryText"
                textAlign="center"
                marginBottom="xl"
              />
              <AccountActionBar
                hasSend={actionBarProps.hasSend}
                hasRequest={actionBarProps.hasRequest}
                hasDelegate={actionBarProps.hasDelegate}
                ticker={routeTicker}
                compact={routeTicker !== 'DC'}
                hasBottomTitle={routeTicker !== 'DC'}
              />
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
              data={activityData}
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
    </ReAnimatedBox>
  )
}

export default withTransactionDetail(AccountTokenScreen)
