import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAsync } from 'react-async-hook'
import SharedGroupPreferences from 'react-native-shared-group-preferences'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '../../components/Box'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import usePrevious from '../../utils/usePrevious'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountLazyQuery, useAccountQuery } from '../../generated/graphql'
import useAppear from '../../utils/useAppear'
import { withTransactionDetail } from './TransactionDetail'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import StatusBanner from '../StatusPage/StatusBanner'
import { checkSecureAccount } from '../../storage/secureStorage'
import { getJazzSeed, isTestnet } from '../../utils/accountUtils'
import AccountsTopNav from './AccountsTopNav'
import AccountTokenList from './AccountTokenList'
import AccountActionBar from './AccountActionBar'
import AccountBalance from './AccountBalance'
import ConnectedWallets from './ConnectedWallets'
import useLayoutHeight from '../../utils/useLayoutHeight'
import { OnboardingOpt } from '../onboarding/onboardingTypes'
import globalStyles from '../../theme/globalStyles'
import { FadeInSlow } from '../../components/FadeInOut'

const AccountsScreen = () => {
  const widgetGroup = 'group.com.helium.mobile.wallet.widget'
  const navigation = useNavigation<HomeNavigationProp>()
  const {
    sortedAccounts,
    currentAccount,
    setCurrentAccount,
    defaultAccountAddress,
  } = useAccountStorage()
  const prevSortedAccounts = usePrevious<CSAccount[] | undefined>(
    sortedAccounts,
  )
  const [navLayoutHeight, setNavLayoutHeight] = useLayoutHeight()
  const { openedNotification } = useNotificationStorage()
  const { locked } = useAppStorage()
  const { reset } = useOnboarding()
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')
  const [walletsVisible, setWalletsVisible] = useState(false)
  const { top } = useSafeAreaInsets()

  useAppear(() => {
    reset()
  })

  const { data: accountData, error: accountsError } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
    pollInterval: 30000,
    // TODO: adjust this interval if needed
  })

  const [fetchAccount, { error: lazyAccountError }] = useAccountLazyQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
  })

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
    if (!accountsError && !lazyAccountError) return

    if (accountsError) {
      console.warn('accounts', accountsError)
    }

    if (lazyAccountError) {
      console.warn('lazyAccount', lazyAccountError)
    }
  }, [accountsError, lazyAccountError])

  useEffect(() => {
    if (
      prevSortedAccounts &&
      sortedAccounts.length - prevSortedAccounts.length === 1
    ) {
      // We have a new account, snap to it
      const newAccount = sortedAccounts[sortedAccounts.length - 1]
      setCurrentAccount(newAccount)
    }
  }, [
    prevSortedAccounts,
    setCurrentAccount,
    sortedAccounts,
    sortedAccounts.length,
  ])

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
        },
        widgetGroup,
      )
    }
  }, [defaultAccountAddress, sortedAccounts])

  const toggleWalletsVisible = useCallback(() => {
    setWalletsVisible((v) => !v)
  }, [])

  const handleAddNew = useCallback(() => {
    navigation.navigate('AddNewAccountNavigator')
    setWalletsVisible(false)
  }, [navigation])

  return (
    <Box flex={1}>
      <AccountsTopNav
        onPressWallet={toggleWalletsVisible}
        onLayout={setNavLayoutHeight}
      />
      {currentAccount?.address && (accountData?.account || accountLoading) && (
        <Animated.View style={globalStyles.container} entering={FadeInSlow}>
          <Box flex={1} justifyContent="center">
            <AccountBalance accountData={accountData?.account} />
            <AccountActionBar />
          </Box>
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
