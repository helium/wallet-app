import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAsync } from 'react-async-hook'
import SharedGroupPreferences from 'react-native-shared-group-preferences'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDebouncedCallback } from 'use-debounce/lib'
import { toUpper } from 'lodash'
import { NetTypes } from '@helium/address'
import Box from '../../components/Box'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import usePrevious from '../../utils/usePrevious'
import { HomeNavigationProp } from '../home/homeTypes'
import {
  AccountBalance as AccountBalanceType,
  CurrencyType,
  useAccountBalanceHistoryQuery,
  useAccountLazyQuery,
  useAccountQuery,
} from '../../generated/graphql'
import useAppear from '../../utils/useAppear'
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
import useLayoutHeight from '../../utils/useLayoutHeight'
import { OnboardingOpt } from '../onboarding/onboardingTypes'
import AccountBalanceChart from './AccountBalanceChart'
import useDisappear from '../../utils/useDisappear'
import { RootNavigationProp } from '../../navigation/rootTypes'
import TabBar from '../../components/TabBar'
import { FadeInSlow } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'
import { useGetBalanceHistoryQuery } from '../../store/slices/walletRestApi'

enum SPLTokenType {
  tokens = 'Tokens',
  Collectables = 'Collectables',
}

const AccountsScreen = () => {
  const widgetGroup = 'group.com.helium.mobile.wallet.widget'
  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { sortedAccounts, currentAccount, defaultAccountAddress } =
    useAccountStorage()
  const [navLayoutHeight, setNavLayoutHeight] = useLayoutHeight()
  const { openedNotification } = useNotificationStorage()
  const [tokenType, setTokenType] = useState<SPLTokenType>(SPLTokenType.tokens)
  const { locked, l1Network, solanaNetwork: cluster } = useAppStorage()
  const { reset } = useOnboarding()
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')
  const [walletsVisible, setWalletsVisible] = useState(false)
  const [selectedBalance, setSelectedBalance] = useState<AccountBalanceType>()
  const { top } = useSafeAreaInsets()
  const chartFlex = useSharedValue(0)

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

  const { currency } = useAppStorage()

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

  const prevShowChart = usePrevious(showChart)

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

  useEffect(() => {
    if (!showChart && prevShowChart) {
      chartFlex.value = withTiming(0, { duration: 700 })
    } else if (showChart && !prevShowChart) {
      chartFlex.value = withTiming(100, { duration: 700 })
    }
  }, [chartFlex.value, chartValues, prevShowChart, showChart])

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

  const style = useAnimatedStyle(() => {
    return {
      flex: chartFlex.value,
      justifyContent: 'center',
    }
  })

  const onTouchStart = useCallback(() => {
    handleBalanceHistorySelected(undefined)
  }, [handleBalanceHistorySelected])

  const tabData = useMemo((): Array<{
    value: string
    title: string
  }> => {
    return [
      { value: SPLTokenType.tokens, title: SPLTokenType.tokens },
      { value: SPLTokenType.Collectables, title: SPLTokenType.Collectables },
    ]
  }, [])

  const handleItemSelected = useCallback((type: string) => {
    setTokenType(type as SPLTokenType)
  }, [])

  return (
    <>
      <AccountsTopNav
        onPressWallet={toggleWalletsVisible}
        onLayout={setNavLayoutHeight}
      />
      {currentAccount?.address && (accountData?.account || accountLoading) && (
        <Animated.View style={globalStyles.container} entering={FadeInSlow}>
          <>
            <AccountTokenList
              loading={accountLoading}
              renderHeader={
                <Box flexGrow={1} minHeight={450}>
                  {currentAccount?.address &&
                    (accountData?.account || accountLoading) && (
                      <Box justifyContent="center" flexGrow={1}>
                        <AccountView
                          accountData={accountData?.account}
                          hntPrice={data?.currentPrices?.hnt}
                          selectedBalance={selectedBalance}
                        />
                      </Box>
                    )}
                  <Animated.View style={style}>
                    <Box
                      flex={1}
                      onTouchStart={onTouchStart}
                      backgroundColor="primaryBackground"
                    />
                    <AccountBalanceChart
                      chartValues={chartValues || []}
                      onHistorySelected={handleBalanceHistorySelected}
                      selectedBalance={selectedBalance}
                    />
                    <Box onTouchStart={onTouchStart} />
                  </Animated.View>
                  {l1Network === 'solana' &&
                  currentAccount &&
                  currentAccount.netType === NetTypes.MAINNET ? (
                    <TabBar
                      backgroundColor="black"
                      tabBarOptions={tabData}
                      selectedValue={tokenType}
                      onItemSelected={handleItemSelected}
                      stretchItems
                      marginBottom="ms"
                    />
                  ) : (
                    <Box
                      height={1}
                      backgroundColor="surface"
                      marginBottom="ms"
                    />
                  )}
                </Box>
              }
              showCollectables={
                tokenType === SPLTokenType.Collectables &&
                l1Network === 'solana'
              }
            />
          </>
        </Animated.View>
      )}
      {walletsVisible && (
        <ConnectedWallets
          onClose={toggleWalletsVisible}
          onAddNew={handleAddNew}
          topOffset={navLayoutHeight + top}
        />
      )}
      <StatusBanner />
    </>
  )
}

export default memo(withTransactionDetail(AccountsScreen))
