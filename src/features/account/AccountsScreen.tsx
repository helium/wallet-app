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
import { useDebouncedCallback } from 'use-debounce/lib'
import { toUpper } from 'lodash'
import BottomSheet from '@gorhom/bottom-sheet'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import ListItem from '../../components/ListItem'
import BlurActionSheet from '../../components/BlurActionSheet'
import Box from '../../components/Box'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import {
  AccountBalance as AccountBalanceType,
  CurrencyType,
  useAccountBalanceHistoryQuery,
  useAccountLazyQuery,
  useAccountQuery,
} from '../../generated/graphql'
import useAppear from '../../hooks/useAppear'
import { withTransactionDetail } from './TransactionDetail'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import StatusBanner from '../StatusPage/StatusBanner'
import { checkSecureAccount } from '../../storage/secureStorage'
import { getJazzSeed, isTestnet } from '../../utils/accountUtils'
import AccountsTopNav from './AccountsTopNav'
import AccountTokenList from './AccountTokenList'
import AccountView from './AccountView'
import ConnectedWallets from './ConnectedWallets'
import useLayoutHeight from '../../hooks/useLayoutHeight'
import { OnboardingOpt } from '../onboarding/onboardingTypes'
import AccountBalanceChart from './AccountBalanceChart'
import useDisappear from '../../hooks/useDisappear'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useGetBalanceHistoryQuery } from '../../store/slices/walletRestApi'
import { useBalance } from '../../utils/Balance'
import { useBackgroundStyle } from '../../theme/themeHooks'
import { ITEM_HEIGHT } from './TokenListItem'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import AccountActionBar from './AccountActionBar'
import SUPPORTED_CURRENCIES from '../../utils/supportedCurrencies'
import { NavBarHeight } from '../../components/NavBar'

const AccountsScreen = () => {
  const widgetGroup = 'group.com.helium.mobile.wallet.widget'
  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { sortedAccounts, currentAccount, defaultAccountAddress } =
    useAccountStorage()
  const [navLayoutHeight, setNavLayoutHeight] = useLayoutHeight()
  const [pageHeight, setPageHeight] = useLayoutHeight(0)
  const { openedNotification } = useNotificationStorage()
  const {
    locked,
    l1Network,
    solanaNetwork: cluster,
    currency,
    updateCurrency,
  } = useAppStorage()
  const { reset } = useOnboarding()
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')
  const [walletsVisible, setWalletsVisible] = useState(false)
  const [selectedBalance, setSelectedBalance] = useState<AccountBalanceType>()
  const { top } = useSafeAreaInsets()
  const { updateVars: refreshTokens, updating: updatingTokens } = useBalance()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const listAnimatedPos = useSharedValue<number>(0)
  const [topHeaderHeight, setTopHeaderHeight] = useState(0)
  const topHeaderRef = useRef<View>(null)
  const [currenciesOpen, setCurrenciesOpen] = useState(false)
  const bottomSheetStyle = useBackgroundStyle('secondaryBackground')

  const { t } = useTranslation()

  const snapPoints = useMemo(() => {
    if (!pageHeight) return undefined
    const collapsedHeight = ITEM_HEIGHT * 2
    // Get safe area top height
    const expandedHeight = pageHeight - navLayoutHeight - top - topHeaderHeight
    return [collapsedHeight, expandedHeight]
  }, [navLayoutHeight, pageHeight, top, topHeaderHeight])

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

  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
    pollInterval: 30000,
    // TODO: adjust this interval if needed
  })

  const [fetchAccount] = useAccountLazyQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
  })

  const { data } = useAccountBalanceHistoryQuery({
    variables: {
      address: currentAccount?.address || '',
      type: toUpper(currency) as CurrencyType,
    },
    skip: !currentAccount?.address,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  })

  const { currentData: solChainBalanceHistory } = useGetBalanceHistoryQuery(
    {
      address: currentAccount?.solanaAddress || '',
      cluster,
      currency,
    },
    {
      skip: !currentAccount?.address,
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
    },
  )

  const showChart = useMemo(() => {
    if (l1Network === 'helium') {
      return (data?.accountBalanceHistory?.length || 0) >= 2
    }
    return (solChainBalanceHistory?.length || 0) >= 2
  }, [data, l1Network, solChainBalanceHistory])

  const chartValues = useMemo(() => {
    // Need to have at least a two days of data to display
    if (!showChart) return

    if (l1Network === 'helium' && data) {
      return data.accountBalanceHistory?.map((bh) => {
        return { y: bh.balance, info: bh }
      })
    }

    return solChainBalanceHistory?.map((bh) => {
      return { y: bh.balance, info: bh }
    })
  }, [data, l1Network, showChart, solChainBalanceHistory])

  useAppear(() => {
    if (!currentAccount?.address) return

    fetchAccount({
      variables: {
        address: currentAccount?.address || '',
      },
    })
  })

  const accountLoading = useMemo(() => {
    return accountData === undefined
  }, [accountData])

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
        (account) => account.address === defaultAccountAddress,
      )

      const jazzSeed = getJazzSeed(defaultAccountAddress)

      await SharedGroupPreferences.setItem(
        'heliumWalletWidgetKey',
        {
          isTestnet: isTestnet(defaultAccountAddress ?? ''),
          jazzSeed,
          defaultAccountAddress,
          defaultAccountAlias: defaultAccount?.alias,
          currencyType: currency,
        },
        widgetGroup,
      )
    }
  }, [defaultAccountAddress, sortedAccounts])

  const toggleWalletsVisible = useCallback(() => {
    setWalletsVisible((v) => !v)
    setSelectedBalance(undefined)
  }, [])

  const handleBalanceHistorySelected = useDebouncedCallback(
    (accountBalance?: AccountBalanceType) => {
      setSelectedBalance(accountBalance)
    },
    100,
    {
      leading: false,
      trailing: true,
    },
  )

  const handleAddNew = useCallback(() => {
    navigation.navigate('AddNewAccountNavigator')
    setWalletsVisible(false)
  }, [navigation])

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
        top -
        topHeaderHeight -
        navLayoutHeight -
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
        top: top + navLayoutHeight,
        left: 0,
        right: 0,
      }
    }

    const opacity =
      (listAnimatedPos.value - top - topHeaderHeight - navLayoutHeight) /
      (snapPoints[1] - snapPoints[0])

    return {
      opacity: 1 - opacity,
      position: 'absolute',
      top: top + navLayoutHeight,
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

  const toggleCurrenciesOpen = useCallback(
    (open) => () => {
      setCurrenciesOpen(open)
    },
    [],
  )

  const handleCurrencyTypeChange = useCallback(
    (currencyType: string) => () => {
      updateCurrency(currencyType)
      setCurrenciesOpen(false)
    },
    [updateCurrency],
  )

  const currencies = useCallback(() => {
    // Sort by selected currency first
    const sortedCurrencies = Object.keys(SUPPORTED_CURRENCIES).sort((a, b) => {
      if (a === currency) return -1
      if (b === currency) return 1
      return 0
    })

    return (
      <>
        {sortedCurrencies.map((c) => (
          <ListItem
            key={c}
            title={SUPPORTED_CURRENCIES[c]}
            selected={c === currency}
            onPress={handleCurrencyTypeChange(c)}
          />
        ))}
      </>
    )
  }, [currency, handleCurrencyTypeChange])

  const RetractedView = useMemo(() => {
    return (
      <ReAnimatedBox
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
          <AccountTokenCurrencyBalance ticker="HNT" variant="h2Medium" />
        </Box>
        <AccountActionBar ticker="HNT" maxCompact hasBuy />
      </ReAnimatedBox>
    )
  }, [handleTopHeaderLayout, headerAnimatedStyle])

  return (
    <Box flex={1}>
      <Box onLayout={setPageHeight} flex={1}>
        <AccountsTopNav
          onPressWallet={toggleWalletsVisible}
          onLayout={setNavLayoutHeight}
        />
        {RetractedView}
        {currentAccount?.address && (accountData?.account || accountLoading) && (
          <ReAnimatedBox flex={1} style={animatedStyle}>
            <AccountView
              flexGrow={1}
              justifyContent="center"
              onTouchStart={onTouchStart}
              accountData={accountData?.account}
              hntPrice={data?.currentPrices?.hnt}
              selectedBalance={selectedBalance}
              onCurrencySelectorPress={toggleCurrenciesOpen(true)}
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
        {walletsVisible && (
          <ConnectedWallets
            onClose={toggleWalletsVisible}
            onAddNew={handleAddNew}
            topOffset={navLayoutHeight + top}
          />
        )}
        <StatusBanner />
      </Box>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints || [10, 100]}
        backgroundStyle={bottomSheetStyle}
        detached
        animatedPosition={listAnimatedPos}
      >
        <AccountTokenList
          loading={accountLoading}
          onRefresh={refreshTokens}
          refreshing={updatingTokens}
        />
      </BottomSheet>
      <BlurActionSheet
        title={t('accountsScreen.chooseCurrency')}
        open={currenciesOpen}
        onClose={toggleCurrenciesOpen(false)}
      >
        {currencies()}
      </BlurActionSheet>
    </Box>
  )
}

export default memo(withTransactionDetail(AccountsScreen))
