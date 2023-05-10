import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Platform, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAsync } from 'react-async-hook'
import SharedGroupPreferences from 'react-native-shared-group-preferences'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomSheet from '@gorhom/bottom-sheet'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import Box from '@components/Box'
import useAppear from '@hooks/useAppear'
import useLayoutHeight from '@hooks/useLayoutHeight'
import useDisappear from '@hooks/useDisappear'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { NavBarHeight } from '@components/NavBar'
import useHaptic from '@hooks/useHaptic'
import { useBackgroundStyle, useColors } from '@theme/themeHooks'
import WarningBanner, { BannerType } from '@components/WarningBanner'
import { useSelector } from 'react-redux'
import useSolanaHealth from '@hooks/useSolanaHealth'
import { CSAccount } from '@storage/cloudStorage'
import { useHntSolConvert } from '@hooks/useHntSolConvert'
import * as logger from '@utils/logger'
import { useTranslation } from 'react-i18next'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import StatusBanner from '../StatusPage/StatusBanner'
import { checkSecureAccount } from '../../storage/secureStorage'
import AccountsTopNav from './AccountsTopNav'
import AccountTokenList from './AccountTokenList'
import AccountView from './AccountView'
import { OnboardingOpt } from '../onboarding/onboardingTypes'
import AccountBalanceChart from './AccountBalanceChart'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { ITEM_HEIGHT } from './TokenListItem'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import AccountActionBar from './AccountActionBar'
import { useAppDispatch } from '../../store/store'
import { appSlice } from '../../store/slices/appSlice'
import { RootState } from '../../store/rootReducer'
import { withTransactionDetail } from './TransactionDetail'
import { useSolana } from '../../solana/SolanaProvider'
import { useBalance } from '../../utils/Balance'
import { AccountBalance } from '../../types/balance'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/WalletSignBottomSheet'

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
  const { cluster, anchorProvider } = useSolana()
  const { reset } = useOnboarding()
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')
  const [selectedBalance, setSelectedBalance] = useState<AccountBalance>()
  const { top } = useSafeAreaInsets()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const listAnimatedPos = useSharedValue<number>(0)
  const [topHeaderHeight, setTopHeaderHeight] = useState(0)
  const topHeaderRef = useRef<View>(null)
  const bottomSheetStyle = useBackgroundStyle('surfaceSecondary')
  const dispatch = useAppDispatch()
  const { triggerImpact } = useHaptic()
  const colors = useColors()
  const { showBanner } = useSelector((state: RootState) => state.app)
  const { isHealthy } = useSolanaHealth()
  const { hntSolConvertTransaction, hntEstimate, hasEnoughSol } =
    useHntSolConvert()
  const { walletSignBottomSheetRef, setSerializedTx, serializedTx } =
    useWalletSign()
  const { t } = useTranslation()

  useAsync(async () => {
    if (!hntSolConvertTransaction || !anchorProvider) return

    await anchorProvider?.wallet.signTransaction(hntSolConvertTransaction)
    setSerializedTx(hntSolConvertTransaction.serialize())
  }, [hntSolConvertTransaction, setSerializedTx, anchorProvider])

  useAsync(async () => {
    if (
      !anchorProvider ||
      !t ||
      !serializedTx ||
      !hntSolConvertTransaction ||
      hasEnoughSol
    )
      return

    try {
      const decision = await walletSignBottomSheetRef?.show({
        type: WalletStandardMessageTypes.signAndSendTransaction,
        url: 'https://jup.ag',
        additionalMessage: t('browserScreen.wouldYouLikeToConvert', {
          amount: hntEstimate,
          ticker: 'HNT',
        }),
      })

      if (!decision) return

      await anchorProvider.sendAndConfirm(hntSolConvertTransaction)
    } catch (e) {
      logger.error(e)
    }
  }, [
    hntEstimate,
    serializedTx,
    t,
    hasEnoughSol,
    hntSolConvertTransaction,
    anchorProvider,
  ])

  const actualTop = useMemo(() => {
    if (showBanner) {
      return 0
    }
    return top
  }, [top, showBanner])

  const actualBannerHeight = useMemo(() => {
    if (showBanner) {
      return bannerHeight
    }
    return 0
  }, [bannerHeight, showBanner])

  const snapPoints = useMemo(() => {
    if (!pageHeight) return undefined
    const collapsedHeight = ITEM_HEIGHT * 2
    // Get safe area top height
    const expandedHeight =
      pageHeight -
      navLayoutHeight -
      actualTop -
      topHeaderHeight -
      actualBannerHeight
    return [collapsedHeight, expandedHeight]
  }, [
    navLayoutHeight,
    pageHeight,
    actualTop,
    topHeaderHeight,
    actualBannerHeight,
  ])

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

  const showChart = useMemo(() => {
    return balanceHistory?.length >= 2
  }, [balanceHistory])

  const chartValues = useMemo(() => {
    // Need to have at least a two days of data to display
    if (!showChart) return

    return balanceHistory?.map((bh) => {
      return { y: bh.balance, info: bh }
    })
  }, [balanceHistory, showChart])

  useEffect(() => {
    if (!currentAccount || !!currentAccount.ledgerDevice) return
    checkSecureAccount(currentAccount.address)
  }, [currentAccount])

  useEffect(() => {
    if (openedNotification && !locked) {
      // navigate to notifications if we are coming from tapping a push
      navigation.push('NotificationsNavigator')
    }
  }, [navigation, openedNotification, locked])

  useEffect(() => {
    if (!currentAccount?.address || onboardingType === 'import') return

    // Set onboarding back to import when navigating away
    setOnboardingType('import')
  }, [currentAccount, onboardingType])

  // Hook that is used for helium balance widget.
  useAsync(async () => {
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
  }, [defaultAccountAddress, sortedAccounts])

  const toggleWalletsVisible = useCallback(() => {
    triggerImpact('light')
    dispatch(appSlice.actions.toggleConnectedWallets())
    setSelectedBalance(undefined)
  }, [dispatch, triggerImpact])

  const handleBalanceHistorySelected = useCallback(
    (accountBalance?: AccountBalance) => {
      setSelectedBalance(accountBalance)
    },
    [],
  )

  const onTouchStart = useCallback(() => {
    handleBalanceHistorySelected(undefined)
  }, [handleBalanceHistorySelected])

  const animatedStyle = useAnimatedStyle(() => {
    if (!snapPoints) {
      return {
        opacity: 1,
        paddingBottom: 0,
        display: 'flex',
      }
    }

    const realHeight = pageHeight + NavBarHeight
    const diff = realHeight - listAnimatedPos.value
    const opacity =
      (listAnimatedPos.value -
        actualTop -
        topHeaderHeight -
        navLayoutHeight -
        actualBannerHeight -
        pageHeight * 0.3) /
      (snapPoints[1] - snapPoints[0] - pageHeight * 0.3)

    return {
      opacity,
      paddingBottom: diff - NavBarHeight,
      display: opacity <= 0 ? 'none' : 'flex',
    }
  })

  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (!snapPoints) {
      return {
        opacity: 0,
        position: 'absolute',
        top: actualTop + navLayoutHeight + actualBannerHeight,
        left: 0,
        right: 0,
      }
    }

    const opacity =
      (listAnimatedPos.value -
        actualTop -
        topHeaderHeight -
        navLayoutHeight -
        actualBannerHeight) /
      (snapPoints[1] - snapPoints[0])

    return {
      opacity: 1 - opacity,
      position: 'absolute',
      top: actualTop + navLayoutHeight + actualBannerHeight,
      left: 0,
      right: 0,
    }
  })

  const handleTopHeaderLayout = useCallback(() => {
    topHeaderRef.current?.measure((...args) => {
      const [, , , height, , pageY] = args

      if (!height || !pageY) return
      setTopHeaderHeight(height)
    })
  }, [setTopHeaderHeight])

  const RetractedView = useMemo(() => {
    return (
      <ReAnimatedBox
        flexGrow={1}
        style={headerAnimatedStyle}
        paddingTop="m"
        paddingBottom={Platform.OS === 'android' ? 'l' : 'm'}
        flexDirection="row"
        alignItems="center"
        onLayout={handleTopHeaderLayout}
        ref={topHeaderRef}
        marginHorizontal="l"
      >
        <Box flex={1}>
          <AccountTokenCurrencyBalance ticker="ALL" variant="h2Medium" />
        </Box>
        <AccountActionBar ticker="HNT" maxCompact />
      </ReAnimatedBox>
    )
  }, [handleTopHeaderLayout, headerAnimatedStyle])

  const handleIndicatorStyle = useMemo(() => {
    return {
      backgroundColor: colors.secondaryText,
    }
  }, [colors.secondaryText])

  const bannerVisible = useMemo(() => {
    if (cluster === 'devnet') {
      return true
    }
    return !isHealthy
  }, [cluster, isHealthy])

  return (
    <Box flex={1}>
      <Box onLayout={setPageHeight} flex={1}>
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
        {RetractedView}
        {currentAccount?.address && (
          <ReAnimatedBox flex={1} style={animatedStyle}>
            <AccountView
              flexGrow={1}
              justifyContent="center"
              onTouchStart={onTouchStart}
              selectedBalance={selectedBalance}
            />
            <Box>
              {chartValues && (
                <AccountBalanceChart
                  chartValues={chartValues || []}
                  onHistorySelected={handleBalanceHistorySelected}
                  selectedBalance={selectedBalance}
                />
              )}
            </Box>
          </ReAnimatedBox>
        )}
        <StatusBanner />
      </Box>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints || [10, 100]}
        backgroundStyle={bottomSheetStyle}
        detached
        animatedPosition={listAnimatedPos}
        handleIndicatorStyle={handleIndicatorStyle}
      >
        <AccountTokenList />
      </BottomSheet>
    </Box>
  )
}

export default memo(withTransactionDetail(AccountsScreen))
