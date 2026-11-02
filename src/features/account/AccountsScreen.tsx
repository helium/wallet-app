import BottomSheet, {
  type BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet'
import { HNT_MINT } from '@helium/spl-utils'
import useAppear from '@hooks/useAppear'
import useDisappear from '@hooks/useDisappear'
import useHaptic from '@hooks/useHaptic'
import useLayoutHeight from '@hooks/useLayoutHeight'
import useSolanaHealth from '@hooks/useSolanaHealth'
import { useNavigation } from '@react-navigation/native'
import { CSAccount } from '@storage/cloudStorage'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Platform, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SharedGroupPreferences from 'react-native-shared-group-preferences'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { checkSecureAccount } from '../../storage/secureStorage'
import { useAppStore } from '../../store/appStore'
import { AccountBalance } from '../../types/balance'
import { useBalance } from '../../utils/Balance'
import StatusBanner from '../StatusPage/StatusBanner'
import { HomeNavigationProp } from '../home/homeTypes'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import AccountActionBar from './AccountActionBar'
import AccountBalanceChart from './AccountBalanceChart'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import AccountTokenList from './AccountTokenList'
import AccountView from './AccountView'
import AccountsTopNav from './AccountsTopNav'
import { ITEM_HEIGHT } from './TokenListItem'
import { withTransactionDetail } from './TransactionDetail'
import WarningBanner, { BannerType } from './WarningBanner'

// The token drawer's surface and grab bar, matching @ui/Sheet's.
const DrawerBackground = ({ style }: BottomSheetBackgroundProps) => (
  <View style={style} className="rounded-t-3xl bg-secondary" />
)

const DrawerHandle = () => (
  <View className="h-4 items-center justify-center">
    <View className="h-1 w-9 rounded-full bg-foreground/20" />
  </View>
)

const AccountsScreen = () => {
  const widgetGroup = 'group.com.helium.mobile.wallet.widget'
  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { sortedAccounts, currentAccount, defaultAccountAddress } =
    useAccountStorage()
  const [bannerHeight, setBannerHeight] = useLayoutHeight()
  const [navLayoutHeight, setNavLayoutHeight] = useLayoutHeight()
  const [pageHeight, setPageHeight] = useLayoutHeight(0)
  const { openedNotification } = useNotificationStorage()
  const { balanceHistory } = useBalance()
  const { locked, currency } = useAppStorage()
  const { cluster } = useSolana()
  const { reset } = useOnboarding()
  const [selectedBalance, setSelectedBalance] = useState<AccountBalance>()
  const { top } = useSafeAreaInsets()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const listAnimatedPos = useSharedValue<number>(0)
  const [topHeaderHeight, setTopHeaderHeight] = useLayoutHeight()
  const { triggerImpact } = useHaptic()
  const showBanner = useAppStore((state) => state.showBanner)
  const toggleConnectedWallets = useAppStore(
    (state) => state.toggleConnectedWallets,
  )
  const { isHealthy } = useSolanaHealth()

  const actualTop = showBanner ? 0 : top
  const actualBannerHeight = showBanner ? bannerHeight : 0

  const snapPoints = pageHeight
    ? [
        ITEM_HEIGHT * 2,
        pageHeight -
          navLayoutHeight -
          actualTop -
          topHeaderHeight -
          actualBannerHeight,
      ]
    : undefined

  useAppear(() => {
    reset()
  })

  useDisappear(() => {
    setSelectedBalance(undefined)
  })

  // if user signs out from lockscreen
  useEffect(() => {
    if (sortedAccounts.length === 0) {
      rootNav.replace('OnboardingNavigator')
    }
  }, [rootNav, sortedAccounts.length])

  // Need to have at least a two days of data to display
  const chartValues =
    (balanceHistory?.length ?? 0) >= 2
      ? balanceHistory?.map((bh) => ({ y: bh.balance, info: bh }))
      : undefined

  useEffect(() => {
    if (currentAccount?.ledgerDevice) return
    // if current account is keystone account , check pass
    if (currentAccount?.keystoneDevice) return
    const address = currentAccount?.address
    if (address) void checkSecureAccount(address)
  }, [
    currentAccount?.address,
    currentAccount?.ledgerDevice,
    currentAccount?.keystoneDevice,
  ])

  useEffect(() => {
    if (openedNotification && !locked) {
      // navigate to notifications if we are coming from tapping a push
      navigation.push('NotificationsNavigator')
    }
  }, [navigation, openedNotification, locked])

  // Hook that is used for helium balance widget.
  const updateWidget = useEffectEvent(async () => {
    if (Platform.OS === 'ios') {
      const defaultAccount = sortedAccounts.find(
        (account: CSAccount) => account.address === defaultAccountAddress,
      )

      await SharedGroupPreferences.setItem(
        'heliumWalletWidgetKey',
        {
          defaultAccountAddress: defaultAccount?.solanaAddress,
          defaultAccountAlias: defaultAccount?.alias,
          currencyType: currency,
          cluster,
        },
        widgetGroup,
      )
    }
  })
  useEffect(() => {
    updateWidget().catch((e) => console.error(e))
  }, [defaultAccountAddress, sortedAccounts])

  const toggleWalletsVisible = () => {
    triggerImpact('light')
    toggleConnectedWallets()
    setSelectedBalance(undefined)
  }

  // The balance and chart rest above the collapsed sheet and slide up with
  // it, so the drag runs no layout.
  const contentRestStyle = { paddingBottom: snapPoints?.[0] ?? 0 }

  const animatedStyle = useAnimatedStyle(() => {
    if (!snapPoints) {
      return {
        opacity: 1,
        transform: [{ translateY: 0 }],
        display: 'flex',
      }
    }

    const sheetRise = pageHeight - snapPoints[0] - listAnimatedPos.get()
    const opacity =
      (listAnimatedPos.get() -
        actualTop -
        topHeaderHeight -
        navLayoutHeight -
        actualBannerHeight -
        pageHeight * 0.3) /
      (snapPoints[1] - snapPoints[0] - pageHeight * 0.3)

    return {
      opacity,
      transform: [{ translateY: -sheetRise }],
      display: opacity <= 0 ? 'none' : 'flex',
    }
  })

  const headerPositionStyle = {
    position: 'absolute',
    top: actualTop + navLayoutHeight + actualBannerHeight,
    left: 0,
    right: 0,
  } as const

  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (!snapPoints) {
      return { opacity: 0 }
    }

    const opacity =
      (listAnimatedPos.get() -
        actualTop -
        topHeaderHeight -
        navLayoutHeight -
        actualBannerHeight) /
      (snapPoints[1] - snapPoints[0])

    return { opacity: 1 - opacity }
  })

  const bannerVisible = cluster === 'devnet' || !isHealthy

  return (
    <View className="flex-1">
      <View onLayout={setPageHeight} className="flex-1">
        {bannerVisible && (
          <WarningBanner
            type={
              cluster === 'devnet'
                ? BannerType.DevnetTokens
                : BannerType.SolanaHealth
            }
            onLayout={setBannerHeight}
          />
        )}
        <AccountsTopNav
          onPressWallet={toggleWalletsVisible}
          onLayout={setNavLayoutHeight}
        />
        <Animated.View
          style={[headerPositionStyle, headerAnimatedStyle]}
          onLayout={setTopHeaderHeight}
          className={
            Platform.OS === 'android'
              ? 'mx-6 grow flex-row items-center pb-6 pt-4'
              : 'mx-6 grow flex-row items-center py-4'
          }
        >
          <View className="flex-1">
            <AccountTokenCurrencyBalance
              ticker="ALL"
              size="3xl"
              className="font-medium"
            />
          </View>
          <AccountActionBar mint={HNT_MINT} maxCompact hasSwaps />
        </Animated.View>
        {!!currentAccount?.address && (
          <Animated.View
            className="flex-1"
            style={[contentRestStyle, animatedStyle]}
          >
            <AccountView
              className="grow justify-center"
              onTouchStart={() => setSelectedBalance(undefined)}
              selectedBalance={selectedBalance}
            />
            <View>
              {chartValues && (
                <AccountBalanceChart
                  chartValues={chartValues}
                  onHistorySelected={setSelectedBalance}
                  selectedBalance={selectedBalance}
                />
              )}
            </View>
          </Animated.View>
        )}
        <StatusBanner />
      </View>
      <BottomSheet
        enableDynamicSizing={false}
        ref={bottomSheetRef}
        snapPoints={snapPoints || [10, 100]}
        backgroundComponent={DrawerBackground}
        handleComponent={DrawerHandle}
        detached
        animatedPosition={listAnimatedPos}
      >
        <AccountTokenList />
      </BottomSheet>
    </View>
  )
}

export default withTransactionDetail(AccountsScreen)
