import BlurActionSheet from '@components/BlurActionSheet'
import ListItem from '@components/ListItem'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useLayoutHeight from '@hooks/useLayoutHeight'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { useModal } from '@storage/ModalsProvider'
import { DUR } from '@theme/motion'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import { ChevronLeft } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, ScrollView, View } from 'react-native'
import Animated, {
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
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

const delayedAnimation = FadeIn.duration(DUR.enter)
  .delay(300)
  .reduceMotion(ReduceMotion.Never)

const MIN_BOTTOM_BAR_HEIGHT = 80

const STICKY_HEADER_INDICES = [0]

const SafeArea = withUniwind(SafeAreaView)
const BackIcon = withUniwind(ChevronLeft)

const SheetBackground = () => (
  <View className="flex-1 rounded-t-3xl bg-popover" />
)

const SheetHandle = () => (
  <View className="h-4 items-center justify-center">
    <View className="h-1 w-9 rounded-full bg-foreground/20" />
  </View>
)

type Route = RouteProp<HomeStackParamList, 'AccountTokenScreen'>

const AccountTokenScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation()
  const { currentAccount } = useAccountStorage()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [topHeaderHeight, setTopHeaderHeight] = useState(0)
  const [listHeight, setListHeight] = useLayoutHeight()
  const [bottomScreenHeaderHeight, setBottomScreenHeaderHeight] =
    useLayoutHeight()
  const [backHeaderHeight, setBackHeaderHeight] = useLayoutHeight()
  const [actualHeight, setActualHeight] = useLayoutHeight()
  const topHeaderRef = useRef<View>(null)
  const headerContainerRef = useRef<View>(null)
  const [topHeaderYPos, setTopHeaderYPos] = useState(0)
  const [headerContainerYPos, setHeaderContainerYPos] = useState(0)
  const listAnimatedPos = useSharedValue<number>(0)
  const { cluster, isDevnet } = useSolana()
  const insets = useSafeAreaInsets()
  const { showModal } = useModal()
  const [
    onEndReachedCalledDuringMomentum,
    setOnEndReachedCalledDuringMomentum,
  ] = useState(true)

  const mintStr = route.params.mint
  const mint = usePublicKey(mintStr)!

  const { json, symbol } = useMetaplexMetadata(mint)

  const toggleFiltersOpen = (open: boolean) => () => {
    setFiltersOpen(open)
  }

  const filterState = useActivityFilter()

  const {
    data: activityData,
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useSolanaActivityList({
    account: currentAccount,
    filter: filterState.filter,
    mint: mint!,
  })

  const handleOnFetchMoreActivity = () => {
    if (activityLoading || onEndReachedCalledDuringMomentum) return

    fetchMoreActivity()
    setOnEndReachedCalledDuringMomentum(true)
  }

  const handleOnMomentumScrollBegin = () => {
    setOnEndReachedCalledDuringMomentum(false)
  }

  const getSnapPoints = () => {
    if (!actualHeight || !topHeaderYPos || !headerContainerYPos) return
    const collapsed = Math.max(
      actualHeight - headerContainerYPos,
      MIN_BOTTOM_BAR_HEIGHT,
    )
    const expanded =
      actualHeight - insets.top - backHeaderHeight - topHeaderHeight
    return [collapsed, expanded]
  }
  const snapPoints = getSnapPoints()
  const wallet = useCurrentWallet()
  const { amount } = useOwnedAmount(wallet, mint)

  const canShowList = snapPoints?.length === 2

  const topHeaderAnimatedStyle = useAnimatedStyle(() => {
    if (!snapPoints || !canShowList) {
      return { opacity: 0 }
    }

    const o =
      (listAnimatedPos.get() - insets.top - topHeaderHeight) /
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
    const diff = listAnimatedPos.get() - expandedPosition
    const o = diff / (snapPoints[1] - snapPoints[0])

    return {
      opacity: o,
    }
  }, [snapPoints, topHeaderHeight, listHeight])

  const { show: showTxnDetail } = useTransactionDetail()

  const showTransactionDetail = (item: Activity) => {
    showTxnDetail({
      item,
      accountAddress: currentAccount?.address || '',
      mint,
    })
  }

  const hasAirdrop =
    cluster === 'devnet' &&
    (mint.equals(NATIVE_MINT) ||
      mint.equals(HNT_MINT) ||
      mint.equals(IOT_MINT) ||
      mint.equals(MOBILE_MINT))

  const renderHeader = () => {
    const filterName = t(`accountsScreen.filterTypes.${filterState.filter}`)

    return (
      <View
        onLayout={setBottomScreenHeaderHeight}
        className="absolute left-0 right-0 top-0 mb-4 flex-row items-center justify-between border-y border-border bg-popover px-6"
      >
        <Text
          size="base"
          className="text-muted-foreground"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {filterName}
        </Text>
        <PressableScale feedback="opacity" onPress={toggleFiltersOpen(true)}>
          <Text size="base" className="p-3 text-muted-foreground">
            {t('accountsScreen.filter')}
          </Text>
        </PressableScale>
      </View>
    )
  }

  const keyExtractor = (item: Activity) => {
    return item.hash
  }

  const renderItem = ({ item, index }: { item: Activity; index: number }) => {
    const isFirst = index === 0
    const isLast = index === (activityData?.length || 0) - 1
    return (
      <View
        className="bg-popover px-6"
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
      </View>
    )
  }

  const renderFooter = () => {
    if (!activityLoading) {
      return (
        <View
          className="flex-row items-center justify-center bg-popover px-2 py-4"
          style={{
            marginTop: activityData?.length > 0 ? 0 : bottomScreenHeaderHeight,
          }}
        >
          <Text
            size="base"
            className="text-center text-muted-foreground"
            maxFontSizeMultiplier={1.3}
          >
            {t('accountsScreen.allFilterFooter')}
          </Text>
        </View>
      )
    }

    return (
      <View className="flex-row items-center justify-center px-2 py-6">
        <Spinner animating={activityLoading} />
      </View>
    )
  }

  const setFilter = (filterType: FilterType) => () => {
    setFiltersOpen(false)
    filterState.change(filterType)
  }

  const filters = () => (
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
  )

  const handleHeaderLayout = () => {
    headerContainerRef.current?.measure((...args) => {
      const [, , , height, , pageY] = args
      if (!height || !pageY) return
      setHeaderContainerYPos(height + pageY)
    })
  }

  const handleTopHeaderLayout = () => {
    topHeaderRef.current?.measure((...args) => {
      const [, , , height, , pageY] = args

      if (!height || !pageY) return
      setTopHeaderYPos(height + pageY)
      setTopHeaderHeight(height)
    })
  }

  const getActionBarProps = () => {
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
  }
  const actionBarProps = getActionBarProps()

  return (
    <View className="flex-1" onLayout={setActualHeight}>
      <SafeArea className="flex-1">
        <View className="flex-row px-6 py-3" onLayout={setBackHeaderHeight}>
          <View className="absolute inset-0 items-center justify-center">
            <Text size="xl" className="font-medium">
              {t('accountsScreen.title', {
                ticker: symbol,
              })}
            </Text>
          </View>
          <PressableScale
            feedback="opacity"
            onPress={navigation.goBack}
            hitSlop={24}
            className="flex-row items-center gap-1"
          >
            <BackIcon size={16} colorClassName="accent-muted-foreground" />
            <Text className="text-muted-foreground">{t('generic.back')}</Text>
          </PressableScale>
        </View>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          className="grow"
          contentContainerClassName="grow justify-center"
        >
          <View
            className="justify-center px-6"
            ref={headerContainerRef}
            onLayout={handleHeaderLayout}
          >
            <Animated.View style={topHeaderAnimatedStyle}>
              <View
                className={
                  Platform.OS === 'android'
                    ? 'flex-row items-center justify-center pb-6 pt-4'
                    : 'flex-row items-center justify-center py-4'
                }
                onLayout={handleTopHeaderLayout}
                ref={topHeaderRef}
              >
                <View className="flex-1">
                  <AccountTokenBalance
                    showTicker={false}
                    textVariant="h2Medium"
                    className="flex-1 justify-start"
                    mint={mint}
                  />
                  {!!symbol && (
                    <AccountTokenCurrencyBalance
                      ticker={symbol.toUpperCase()}
                      size="base"
                      className="text-muted-foreground"
                    />
                  )}
                </View>
                <AccountActionBar
                  hasSend={actionBarProps.hasSend}
                  hasRequest={actionBarProps.hasRequest}
                  hasDelegate={actionBarProps.hasDelegate}
                  mint={mint}
                  maxCompact
                />
              </View>
            </Animated.View>
            <Animated.View style={bottomHeaderAnimatedStyle}>
              <View className="my-8">
                <View className="mb-4 items-center">
                  <TokenIcon img={json?.image} size={50} />
                </View>
                <AccountTokenBalance
                  testID="AccountToken.Balance"
                  className="mt-2"
                  mint={mint}
                />
                {!!symbol && (
                  <AccountTokenCurrencyBalance
                    ticker={symbol.toUpperCase()}
                    size="xl"
                    className="mb-8 text-center text-muted-foreground"
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
              </View>
            </Animated.View>
            {mint.equals(NATIVE_MINT) &&
            !isDevnet &&
            (amount || 0) < MIN_BALANCE_THRESHOLD ? (
              <>
                <View
                  className="mb-6 rounded bg-warning-100 p-2"
                  style={{ minHeight: topHeaderHeight }}
                >
                  <Text className="text-black">
                    {t('accountsScreen.solWarning')}
                  </Text>
                  <PressableScale
                    feedback="opacity"
                    className="mt-4 items-center justify-center rounded-lg bg-warning-500"
                    onPress={() =>
                      showModal({ type: 'InsufficientSolConversion' })
                    }
                  >
                    <Text size="base" className="p-3 text-black">
                      {t('accountsScreen.solSwap')}
                    </Text>
                  </PressableScale>
                </View>
                <View style={{ height: MIN_BOTTOM_BAR_HEIGHT }} />
              </>
            ) : (
              <View style={{ height: topHeaderHeight }} />
            )}
          </View>
        </ScrollView>
      </SafeArea>
      {!!canShowList && (
        <BottomSheet
          animateOnMount={false}
          snapPoints={snapPoints || []}
          backgroundComponent={SheetBackground}
          animatedPosition={listAnimatedPos}
          handleComponent={SheetHandle}
        >
          <Animated.View className="flex-1" entering={delayedAnimation}>
            <BottomSheetFlatList
              contentInsetAdjustmentBehavior="automatic"
              onLayout={setListHeight}
              keyExtractor={keyExtractor}
              directionalLockEnabled
              renderItem={renderItem}
              ListHeaderComponent={renderHeader}
              stickyHeaderIndices={STICKY_HEADER_INDICES}
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
        <View className="absolute bottom-0 left-0 top-[120px] w-8" />
      )}

      <BlurActionSheet
        title={t('accountsScreen.filterTransactions')}
        open={filtersOpen}
        onClose={toggleFiltersOpen(false)}
      >
        {filters()}
      </BlurActionSheet>
    </View>
  )
}

export default withTransactionDetail(AccountTokenScreen)
