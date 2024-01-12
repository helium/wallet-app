import ActivityIndicator from '@components/ActivityIndicator'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import FadeInOut, { DelayedFadeIn } from '@components/FadeInOut'
import ListItem from '@components/ListItem'
import { NavBarHeight } from '@components/NavBar'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BottomSheet, {
  BottomSheetFlatList,
  WINDOW_HEIGHT,
} from '@gorhom/bottom-sheet'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useLayoutHeight from '@hooks/useLayoutHeight'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useRoute } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { useModal } from '@storage/ModalsProvider'
import globalStyles from '@theme/globalStyles'
import { useColors } from '@theme/themeHooks'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, ScrollView, View } from 'react-native'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { Activity } from '../../types/activity'
import { HomeStackParamList } from '../home/homeTypes'
import AccountActionBar from './AccountActionBar'
import { FilterType, useActivityFilter } from './AccountActivityFilter'
import AccountTokenBalance from './AccountTokenBalance'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import {
  useTransactionDetail,
  withTransactionDetail,
} from './TransactionDetail'
import TxnListItem from './TxnListItem'
import useSolanaActivityList from './useSolanaActivityList'

const delayedAnimation = FadeIn.delay(300)

const MIN_BOTTOM_BAR_HEIGHT = 80

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
  const { cluster, isDevnet } = useSolana()
  const insets = useSafeAreaInsets()
  const colors = useColors()
  const { showModal } = useModal()
  const [
    onEndReachedCalledDuringMomentum,
    setOnEndReachedCalledDuringMomentum,
  ] = useState(true)

  const mintStr = useMemo(() => route.params.mint, [route.params.mint])
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const mint = usePublicKey(mintStr)!

  const { json, symbol } = useMetaplexMetadata(mint)

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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    mint: mint!,
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
    const collapsed = Math.max(
      actualHeight - headerContainerYPos,
      MIN_BOTTOM_BAR_HEIGHT,
    )
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
  const wallet = useCurrentWallet()
  const { amount } = useOwnedAmount(wallet, mint)

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
        mint,
      })
    },
    [currentAccount?.address, showTxnDetail, mint],
  )

  const hasAirdrop = useMemo(() => {
    if (cluster === 'devnet') {
      return (
        mint.equals(NATIVE_MINT) ||
        mint.equals(HNT_MINT) ||
        mint.equals(IOT_MINT) ||
        mint.equals(MOBILE_MINT)
      )
    }
    return false
  }, [mint, cluster])

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
              mint={mint}
              onPress={showTransactionDetail}
              item={item}
              now={now}
              isLast={isLast}
            />
          </Box>
        </FadeInOut>
      )
    },
    [
      activityData?.length,
      bottomScreenHeaderHeight,
      mint,
      now,
      showTransactionDetail,
    ],
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
        {!mint.equals(DC_MINT) && (
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
        {mint.equals(DC_MINT) && (
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
    [filterState.filter, mint, setFilter, t],
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

    if (mint.equals(DC_MINT)) {
      options = {
        hasSend: false,
        hasRequest: false,
        hasDelegate: true,
        compact: false,
        hasBottomTitle: false,
      }
    }

    return options
  }, [mint])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <BackScreen
        padding="none"
        title={t('accountsScreen.title', {
          ticker: symbol,
        })}
        onHeaderLayout={setBackHeaderHeight}
      >
        <ScrollView
          style={{
            flexGrow: 1,
          }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
          }}
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
                    mint={mint}
                    flex={1}
                  />
                  {!!symbol && (
                    <AccountTokenCurrencyBalance
                      ticker={symbol.toUpperCase()}
                      variant="body1"
                      color="secondaryText"
                    />
                  )}
                </Box>
                <AccountActionBar
                  hasSend={actionBarProps.hasSend}
                  hasRequest={actionBarProps.hasRequest}
                  hasDelegate={actionBarProps.hasDelegate}
                  mint={mint}
                  maxCompact
                />
              </Box>
            </Animated.View>
            <Animated.View style={bottomHeaderAnimatedStyle}>
              <Box marginVertical="xl">
                <Box alignItems="center" marginBottom="m">
                  <TokenIcon img={json?.image} size={50} />
                </Box>
                <AccountTokenBalance marginTop="s" mint={mint} />
                {!!symbol && (
                  <AccountTokenCurrencyBalance
                    ticker={symbol.toUpperCase()}
                    variant="h4"
                    color="secondaryText"
                    textAlign="center"
                    marginBottom="xl"
                  />
                )}
                <AccountActionBar
                  hasSend={actionBarProps.hasSend}
                  hasRequest={actionBarProps.hasRequest}
                  hasDelegate={actionBarProps.hasDelegate}
                  mint={mint}
                  compact={!mint.equals(DC_MINT)}
                  hasBottomTitle={!mint.equals(DC_MINT)}
                  hasAirdrop={hasAirdrop}
                />
              </Box>
            </Animated.View>
            {mint.equals(NATIVE_MINT) &&
            !isDevnet &&
            (amount || 0) < MIN_BALANCE_THRESHOLD ? (
              <>
                <Box
                  minHeight={topHeaderHeight}
                  mb="l"
                  backgroundColor="warning"
                  borderRadius="s"
                  p="s"
                >
                  <Text variant="body2" color="black700">
                    {t('accountsScreen.solWarning')}
                  </Text>
                  <TouchableOpacityBox
                    marginTop="m"
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="orange500"
                    borderRadius="m"
                    onPress={() =>
                      showModal({ type: 'InsufficientSolConversion' })
                    }
                  >
                    <Text variant="body1" padding="ms" color="black700">
                      {t('accountsScreen.solSwap')}
                    </Text>
                  </TouchableOpacityBox>
                </Box>
                <Box height={MIN_BOTTOM_BAR_HEIGHT} />
              </>
            ) : (
              <Box height={topHeaderHeight} />
            )}
          </Box>
        </ScrollView>
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
