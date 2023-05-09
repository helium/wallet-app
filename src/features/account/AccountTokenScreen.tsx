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
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import Text from '@components/Text'
import ListItem from '@components/ListItem'
import TokenIcon from '@components/TokenIcon'
import BlurActionSheet from '@components/BlurActionSheet'
import useLayoutHeight from '@hooks/useLayoutHeight'
import FadeInOut, { DelayedFadeIn } from '@components/FadeInOut'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import ActivityIndicator from '@components/ActivityIndicator'
import { ReAnimatedBox } from '@components/AnimatedBox'
import globalStyles from '@theme/globalStyles'
import { useColors } from '@theme/themeHooks'
import { NavBarHeight } from '@components/NavBar'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import AccountActionBar from './AccountActionBar'
import { FilterType, useActivityFilter } from './AccountActivityFilter'
import TxnListItem from './TxnListItem'
import {
  useTransactionDetail,
  withTransactionDetail,
} from './TransactionDetail'
import { HomeStackParamList } from '../home/homeTypes'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import AccountTokenBalance from './AccountTokenBalance'
import { Activity } from '../../types/activity'
import { useSolana } from '../../solana/SolanaProvider'
import useSolanaActivityList from './useSolanaActivityList'

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
  const { cluster } = useSolana()
  const insets = useSafeAreaInsets()
  const colors = useColors()
  const [
    onEndReachedCalledDuringMomentum,
    setOnEndReachedCalledDuringMomentum,
  ] = useState(true)

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
  } = useSolanaActivityList({
    account: currentAccount,
    filter: filterState.filter,
    ticker: routeTicker,
  })

  const handleOnFetchMoreActivity = useCallback(() => {
    if (activityLoading || onEndReachedCalledDuringMomentum) return

    fetchMoreActivity()
    setOnEndReachedCalledDuringMomentum(true)
  }, [activityLoading, fetchMoreActivity, onEndReachedCalledDuringMomentum])

  const handleOnMomentumScrollBegin = useCallback(() => {
    setOnEndReachedCalledDuringMomentum(false)
  }, [])

  const actualHeight = useMemo(() => {
    return WINDOW_HEIGHT - insets.bottom - NavBarHeight
  }, [insets.bottom])

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

  const hasAirdrop = useMemo(() => {
    if (cluster === 'devnet') {
      return (
        routeTicker === 'SOL' ||
        routeTicker === 'HNT' ||
        routeTicker === 'IOT' ||
        routeTicker === 'MOBILE'
      )
    }
    return false
  }, [routeTicker, cluster])

  const renderHeader = useCallback(() => {
    const filterName = t(`accountsScreen.filterTypes.${filterState.filter}`)

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
          {filterName}
        </Text>
        <TouchableOpacityBox onPress={toggleFiltersOpen(true)}>
          <Text variant="body1" padding="ms" color="secondaryText">
            {t('accountsScreen.filter')}
          </Text>
        </TouchableOpacityBox>
      </Box>
    )
  }, [filterState.filter, setBottomScreenHeaderHeight, t, toggleFiltersOpen])

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
    if (!activityLoading) {
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
  }, [activityData, activityLoading, bottomScreenHeaderHeight, t])

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
              title={`${t('accountsScreen.filterTypes.all')}`}
              selected={filterState.filter === 'all'}
              onPress={setFilter('all')}
              hasPressedState={false}
            />
            <ListItem
              key="in"
              title={t('accountsScreen.filterTypes.in')}
              onPress={setFilter('in')}
              selected={filterState.filter === 'in'}
              hasPressedState={false}
            />
            <ListItem
              key="out"
              title={t('accountsScreen.filterTypes.out')}
              onPress={setFilter('out')}
              selected={filterState.filter === 'out'}
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
      </>
    ),
    [filterState.filter, routeTicker, setFilter, t],
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
                hasAirdrop={hasAirdrop}
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
              initialNumToRender={10}
              onEndReachedThreshold={0.01}
              onMomentumScrollBegin={handleOnMomentumScrollBegin}
              onEndReached={handleOnFetchMoreActivity}
              data={activityData}
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
