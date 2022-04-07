/* eslint-disable react/jsx-props-no-spreading */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { Carousel } from 'react-native-snap-carousel'
import CogIco from '@assets/images/cog.svg'
import AccountIco from '@assets/images/account.svg'
import { AnimatePresence } from 'moti'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { NetType } from '@helium/crypto-react-native'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  useColors,
  useOpacity,
  useSpacing,
  useVerticalHitSlop,
} from '../../theme/themeHooks'
import { wp } from '../../utils/layout'
import MultiAccountNavigator from '../onboarding/multiAccount/MultiAccountNavigator'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import OnboardingSegment, {
  OnboardingOpt,
} from '../onboarding/multiAccount/OnboardingSegment'
import AccountHeader from './AccountHeader'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import usePrevious from '../../utils/usePrevious'
import MotiBox from '../../components/MotiBox'
import AccountView, { Action } from './AccountView'
import Text from '../../components/Text'
import TxnListItem from './TxnListItem'
import useActivityList from './useActivityList'
import { HomeNavigationProp } from '../home/homeTypes'
import {
  Activity,
  useAccountLazyQuery,
  useAccountQuery,
} from '../../generated/graphql'
import SafeAreaBox from '../../components/SafeAreaBox'
import * as AccountUtils from '../../utils/accountUtils'
import { useAccountSelector } from '../../components/AccountSelector'
import AccountActivityFilter, {
  useActivityFilter,
} from './AccountActivityFilter'
import useAppear from '../../utils/useAppear'
import {
  useTransactionDetail,
  withTransactionDetail,
} from './TransactionDetail'
import NotificationIcon from '../../components/NotificationIcon'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import StatusBanner from '../StatusPage/StatusBanner'

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
type Item = {
  item: Activity
  index: number
}

const AccountsScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const spacing = useSpacing()
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(layoutReducer, initialState)
  const filterState = useActivityFilter()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const verticalHitSlop = useVerticalHitSlop('l')
  const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
  const { backgroundStyle: handleStyle } = useOpacity('black500', 1)
  const { primaryIcon } = useColors()
  const carouselRef = useRef<Carousel<CSAccount | null>>(null)
  const { sortedAccounts, currentAccount, setCurrentAccount } =
    useAccountStorage()
  const prevAccount = usePrevious(currentAccount)
  const prevSortedAccounts = usePrevious<CSAccount[] | undefined>(
    sortedAccounts,
  )
  const { openedNotification } = useNotificationStorage()
  const { locked, requirePinForPayment } = useAppStorage()
  const {
    onboardingData: { netType },
  } = useOnboarding()
  const { show } = useAccountSelector()
  const { show: showTxnDetail } = useTransactionDetail()
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')

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

  const {
    data: activityData,
    error: activityError,
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useActivityList({
    address: currentAccount?.address,
    filter: filterState.filter,
  })

  useEffect(() => {
    if (!accountsError && !activityError && !lazyAccountError) return

    if (accountsError) {
      console.warn('accounts', accountsError)
    }
    if (activityError) {
      console.warn('activity', activityError)
    }

    if (lazyAccountError) {
      console.warn('lazyAccount', lazyAccountError)
    }
  }, [accountsError, activityError, lazyAccountError])

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

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(currentAccount?.address),
    [currentAccount],
  )

  const handleAddressBook = useCallback(() => {
    navigation.push('AddressBookNavigator')
  }, [navigation])

  const handleNotificationsSelected = useCallback(() => {
    navigation.push('NotificationsNavigator')
  }, [navigation])

  const carouselData = useMemo(() => {
    return [
      ...sortedAccounts,
      null, // needed for account import/create state
    ]
  }, [sortedAccounts])

  useEffect(() => {
    if (
      currentAccount?.address &&
      prevAccount?.address !== currentAccount.address
    ) {
      const index = carouselData.findIndex(
        (acct) => acct?.address === currentAccount.address,
      )
      if (index < 0) return
      carouselRef.current?.snapToItem(index)
    }
  }, [carouselData, currentAccount, prevAccount])

  const renderCarouselItem = ({ item }: { item: CSAccount | null }) => {
    if (!item) {
      return (
        <OnboardingSegment
          marginTop="s"
          padding="m"
          onSegmentChange={setOnboardingType}
          onboardingType={onboardingType}
        />
      )
    }
    return <AccountHeader account={item} />
  }

  const onSnapToItem = useCallback(
    (index: number) => {
      setCurrentAccount(carouselData[index])
    },
    [carouselData, setCurrentAccount],
  )

  const snapPoints = useMemo(() => {
    const { screenHeight, accountViewStart, accountViewHeight } = state
    const mid = screenHeight - accountViewStart - accountViewHeight
    const expanded = screenHeight - accountViewStart - spacing.l

    if (mid <= 0 || expanded <= 0) return ['5%']
    return [mid, expanded]
  }, [spacing.l, state])

  const showTransactionDetail = useCallback(
    (item: Activity) => {
      showTxnDetail({
        item,
        accountAddress: currentAccount?.address || '',
      })
    },
    [currentAccount, showTxnDetail],
  )

  const renderFlatlistItem = useCallback(
    ({ item, index }: Item) => {
      const isLast = index === (activityData?.length || 0) - 1
      return (
        <TxnListItem
          onPress={showTransactionDetail}
          item={item}
          accountAddress={currentAccount?.address}
          now={now}
          isLast={isLast}
        />
      )
    },
    [activityData.length, currentAccount, now, showTransactionDetail],
  )

  const renderSeparator = useCallback(() => {
    return <Box height={1} width="100%" backgroundColor="primaryBackground" />
  }, [])

  const keyExtractor = useCallback((item: Activity) => {
    return item.hash
  }, [])

  const footer = useMemo(() => {
    if (filterState.filter === 'all') {
      return (
        <Text
          variant="body1"
          color="surfaceSecondaryText"
          padding="l"
          textAlign="center"
        >
          {t('accountsScreen.allFilterFooter')}
        </Text>
      )
    }
    return null
  }, [filterState.filter, t])

  const requestMore = useCallback(() => {
    fetchMoreActivity()
  }, [fetchMoreActivity])

  const carouselWidths = useMemo(() => {
    const sliderWidth = wp(100)
    const itemWidth = sliderWidth - spacing.lx * 2
    return { sliderWidth, itemWidth }
  }, [spacing.lx])

  const handleActionSelected = useCallback(
    (type: Action) => {
      switch (type) {
        case 'send':
          if (requirePinForPayment) {
            navigation.navigate('ConfirmPin', { action: 'payment' })
          } else {
            navigation.navigate('PaymentScreen')
          }
          break
        case 'request':
          navigation.navigate('RequestScreen')
          break
        case 'payment':
          // TODO: Remove eventually
          if (accountNetType !== NetType.TESTNET) return
          navigation.navigate('WifiPurchase')
          break
        case 'vote':
          navigation.navigate('VoteNavigator')
          break
        case '5G':
          navigation.navigate('PurchaseData')
          break
        default:
          show()
          break
      }
    },
    [accountNetType, navigation, requirePinForPayment, show],
  )

  const navToSettings = useCallback(
    () => navigation.navigate('SettingsNavigator'),
    [navigation],
  )

  const fadeSettings = useMemo(
    () => ({
      from: {
        opacity: 0,
      },
      animate: {
        opacity: 1,
      },
      exit: {
        opacity: 0,
      },
    }),
    [],
  )

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

  return (
    <Box flex={1} onLayout={handleLayout('screenLayout')}>
      <Box minHeight={75} opacity={!currentAccount?.address ? 0 : 100}>
        <AnimatePresence>
          <MotiBox {...fadeSettings}>
            <SafeAreaBox
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              paddingTop="s"
            >
              <TouchableOpacityBox
                hitSlop={verticalHitSlop}
                paddingHorizontal="l"
                onPress={navToSettings}
              >
                <CogIco color={primaryIcon} />
              </TouchableOpacityBox>
              <Box
                paddingHorizontal="l"
                flexDirection="row"
                alignItems="center"
                visible={accountNetType === NetType.TESTNET}
              >
                <Text marginLeft="xs" variant="subtitle1" color="red500">
                  🚧 {t('generic.testnet')} 🚧
                </Text>
              </Box>
              <Box flexDirection="row" paddingHorizontal="l">
                <TouchableOpacityBox
                  hitSlop={verticalHitSlop}
                  onPress={handleNotificationsSelected}
                  marginRight="s"
                >
                  <NotificationIcon />
                </TouchableOpacityBox>
                <TouchableOpacityBox
                  onPress={handleAddressBook}
                  hitSlop={verticalHitSlop}
                >
                  <AccountIco color={primaryIcon} />
                </TouchableOpacityBox>
              </Box>
            </SafeAreaBox>
          </MotiBox>
        </AnimatePresence>
      </Box>
      <Box>
        <Carousel
          ref={carouselRef}
          layout="default"
          vertical={false}
          data={carouselData}
          renderItem={renderCarouselItem}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...carouselWidths}
          onSnapToItem={onSnapToItem}
        />
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
              {...fadeSettings}
            >
              <MultiAccountNavigator netType={netType} />
            </MotiBox>
          )}
        </AnimatePresence>
        {carouselData.map((d, i) => {
          if (i === carouselData.length - 1) return null
          const visible =
            currentAccount && currentAccount?.address === d?.address
          return (
            <AnimatePresence key={d?.address}>
              {visible && (
                <MotiBox
                  key={d?.address || 'ImportCreate'}
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  {...fadeSettings}
                >
                  <AccountView
                    onLayout={handleLayout('accountViewLayout')}
                    onActionSelected={handleActionSelected}
                    visible={visible}
                    accountData={
                      accountData?.account?.address === currentAccount?.address
                        ? accountData?.account
                        : undefined
                    }
                    netType={accountNetType}
                  />
                </MotiBox>
              )}
            </AnimatePresence>
          )
        })}
      </Box>
      {currentAccount && !!currentAccount?.address && snapPoints.length > 0 && (
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          backgroundStyle={backgroundStyle}
          handleIndicatorStyle={handleStyle}
        >
          <AccountActivityFilter
            activityLoading={activityLoading}
            {...filterState}
          />
          <BottomSheetFlatList
            ListFooterComponent={footer}
            ItemSeparatorComponent={renderSeparator}
            data={activityData}
            renderItem={renderFlatlistItem}
            keyExtractor={keyExtractor}
            onEndReached={requestMore}
          />
        </BottomSheet>
      )}

      <StatusBanner />
    </Box>
  )
}

export default memo(withTransactionDetail(AccountsScreen))
