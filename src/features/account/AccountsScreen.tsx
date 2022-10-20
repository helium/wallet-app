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
import { getJazzSeed, isTestnet, L1Network } from '../../utils/accountUtils'
import AccountsTopNav from './AccountsTopNav'
import AccountTokenList from './AccountTokenList'
import AccountView from './AccountView'
import ConnectedWallets from './ConnectedWallets'
import useLayoutHeight from '../../utils/useLayoutHeight'
import { OnboardingOpt } from '../onboarding/onboardingTypes'
import globalStyles from '../../theme/globalStyles'
import { FadeInSlow } from '../../components/FadeInOut'
import AccountBalanceChart from './AccountBalanceChart'
import useDisappear from '../../utils/useDisappear'
import TabBar from '../../components/TabBar'

const AccountsScreen = () => {
  const widgetGroup = 'group.com.helium.mobile.wallet.widget'
  const navigation = useNavigation<HomeNavigationProp>()
  const { sortedAccounts, currentAccount, defaultAccountAddress } =
    useAccountStorage()
  const [navLayoutHeight, setNavLayoutHeight] = useLayoutHeight()
  const { openedNotification } = useNotificationStorage()
  const { locked, l1Network, enableSolana, updateL1Network } = useAppStorage()
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

  const showChart = useMemo(
    () =>
      l1Network === 'helium' && (data?.accountBalanceHistory?.length || 0) >= 2,
    [data, l1Network],
  )
  const prevShowChart = usePrevious(showChart)

  const chartValues = useMemo(() => {
    // Need to have at least a two days of data to display
    if (!data?.accountBalanceHistory || !showChart) return

    return data.accountBalanceHistory?.map((bh) => {
      return { y: bh.balance, info: bh }
    })
  }, [data, showChart])

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
    value: L1Network
    title: string
  }> => {
    return [
      { value: 'helium', title: 'Helium' },
      { value: 'solana_dev', title: 'Solana-Devnet' },
    ]
  }, [])

  const setL1Network = useCallback(
    (l1: string) => {
      updateL1Network(l1 as L1Network)
    },
    [updateL1Network],
  )

  return (
    <Box flex={1}>
      <AccountsTopNav
        onPressWallet={toggleWalletsVisible}
        onLayout={setNavLayoutHeight}
      />
      {currentAccount?.address && (accountData?.account || accountLoading) && (
        <Animated.View style={globalStyles.container} entering={FadeInSlow}>
          <Box flex={100} justifyContent="center">
            <AccountView
              accountData={accountData?.account}
              hntPrice={data?.currentPrices?.hnt}
              selectedBalance={selectedBalance}
            />
          </Box>

          {enableSolana && currentAccount.netType === NetTypes.MAINNET && (
            <TabBar
              tabBarOptions={tabData}
              selectedValue={l1Network}
              onItemSelected={setL1Network}
            />
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
            <Box
              flex={1}
              onTouchStart={onTouchStart}
              backgroundColor="primaryBackground"
            />
          </Animated.View>
          <AccountTokenList
            accountData={accountData?.account}
            loading={accountLoading}
          />
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
    </Box>
  )
}

export default memo(withTransactionDetail(AccountsScreen))
