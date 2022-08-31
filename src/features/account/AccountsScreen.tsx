/* eslint-disable react/jsx-props-no-spreading */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { AnimatePresence } from 'moti'
import { LayoutChangeEvent, LayoutRectangle, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAsync } from 'react-async-hook'
import SharedGroupPreferences from 'react-native-shared-group-preferences'
import Box from '../../components/Box'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useSpacing } from '../../theme/themeHooks'
import { wh } from '../../utils/layout'
import MultiAccountNavigator from '../onboarding/multiAccount/MultiAccountNavigator'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import { OnboardingOpt } from '../onboarding/multiAccount/OnboardingSegment'
import usePrevious from '../../utils/usePrevious'
import MotiBox from '../../components/MotiBox'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountLazyQuery, useAccountQuery } from '../../generated/graphql'
import useAppear from '../../utils/useAppear'
import { withTransactionDetail } from './TransactionDetail'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import StatusBanner from '../StatusPage/StatusBanner'
import { checkSecureAccount } from '../../storage/secureStorage'
import InternetChooseProvider from '../internet/InternetChooseProvider'
import { Moti } from '../../config/animationConfig'
import { getJazzSeed, isTestnet } from '../../utils/accountUtils'
import AccountsCarousel from './AccountsCarousel'
import AccountsTopNav from './AccountsTopNav'
import AccountTokenList from './AccountTokenList'
import AccountActionBar from './AccountActionBar'
import AccountBalance from './AccountBalance'

type AccountLayout = {
  accountViewStart: number
  accountViewHeight: number
  screenHeight: number
}

type LayoutType = 'accountViewLayout' | 'containerLayout' | 'screenLayout'
type AccountLayoutAction = {
  type: LayoutType
  layout: LayoutRectangle
}
const initialState = {
  accountViewStart: 0,
  accountViewHeight: 0,
  screenHeight: 0,
} as AccountLayout

function layoutReducer(state: AccountLayout, action: AccountLayoutAction) {
  switch (action.type) {
    case 'screenLayout': {
      return { ...state, screenHeight: action.layout.height }
    }
    case 'containerLayout': {
      return {
        ...state,
        accountViewStart: action.layout.y,
      }
    }
    case 'accountViewLayout':
      return {
        ...state,
        accountViewHeight: action.layout.height,
      }
  }
}

const AccountsScreen = () => {
  const widgetGroup = 'group.com.helium.mobile.wallet.widget'
  const navigation = useNavigation<HomeNavigationProp>()
  const spacing = useSpacing()
  const [state, dispatch] = useReducer(layoutReducer, initialState)
  const {
    sortedAccounts,
    currentAccount,
    setCurrentAccount,
    defaultAccountAddress,
  } = useAccountStorage()
  const prevSortedAccounts = usePrevious<CSAccount[] | undefined>(
    sortedAccounts,
  )
  const { openedNotification } = useNotificationStorage()
  const { locked } = useAppStorage()
  const {
    onboardingData: { netType },
  } = useOnboarding()
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')
  const [showInternetProviders, setShowInternetProviders] = useState(false)

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

  const updateShowInternetProviders = useCallback(
    (showProviders: boolean) => () => {
      setShowInternetProviders(showProviders)
    },
    [],
  )

  const snapPoints = useMemo(() => {
    const { screenHeight, accountViewStart, accountViewHeight } = state
    const mid = screenHeight - accountViewStart - accountViewHeight
    const expanded = screenHeight - accountViewStart - spacing.l

    if (mid <= 0 || expanded <= 0) return [5]
    return [mid, expanded]
  }, [spacing.l, state])

  useEffect(() => {
    if (!currentAccount?.address || onboardingType === 'import') return

    // Set onboarding back to import when navigating away
    setOnboardingType('import')
  }, [currentAccount, onboardingType])

  const handleLayout = useCallback(
    (type: LayoutType) => (e: LayoutChangeEvent) => {
      dispatch({ type, layout: e.nativeEvent.layout })
    },
    [],
  )

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

  return (
    <Box flex={1} onLayout={handleLayout('screenLayout')}>
      <Box minHeight={75} opacity={!currentAccount?.address ? 0 : 100}>
        <AnimatePresence>
          <MotiBox {...Moti.fade}>
            <AccountsTopNav />
          </MotiBox>
        </AnimatePresence>
      </Box>
      <Box>
        <AccountsCarousel />
      </Box>
      <Box flex={1} onLayout={handleLayout('containerLayout')}>
        <AnimatePresence>
          {!currentAccount?.address && (
            <MotiBox
              position="absolute"
              top={0}
              bottom={0}
              left={0}
              right={0}
              {...Moti.fade}
            >
              <MultiAccountNavigator netType={netType} />
            </MotiBox>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {currentAccount?.address && (
            <MotiBox
              position="absolute"
              top={0}
              bottom={0}
              left={0}
              right={0}
              {...Moti.fade}
            >
              <AccountTokenList
                accountData={accountData?.account}
                loading={accountLoading}
                ListHeaderComponent={
                  <Box paddingTop="xxl" backgroundColor="primaryBackground">
                    <AccountBalance accountData={accountData?.account} />
                    <AccountActionBar accountData={accountData?.account} />
                  </Box>
                }
              />
            </MotiBox>
          )}
        </AnimatePresence>
      </Box>

      <StatusBanner />

      <InternetChooseProvider
        visible={showInternetProviders}
        top={snapPoints.length > 1 ? wh - snapPoints[1] : 0}
        onClose={updateShowInternetProviders(false)}
      />
    </Box>
  )
}

export default memo(withTransactionDetail(AccountsScreen))
