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
import TestnetIcon from '@assets/images/testnetIcon.svg'
import { AnimatePresence } from 'moti'
import { ActivityIndicator, LayoutRectangle } from 'react-native'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { NetType } from '@helium/crypto-react-native'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import {
  CSAccount,
  useAccountStorage,
} from '../../storage/AccountStorageProvider'
import { useColors, useOpacity, useSpacing } from '../../theme/themeHooks'
import { wh, wp } from '../../utils/layout'
import MultiAccountNavigator from '../onboarding/MultiAccountNavigator'
import { OnboardingOpt } from '../onboarding/OnboardingProvider'
import OnboardingSegment from '../onboarding/OnboardingSegment'
import AccountHeader from './AccountHeader'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import usePrevious from '../../utils/usePrevious'
import MotiBox from '../../components/MotiBox'
import AccountView, { Action } from './AccountView'
import Text from '../../components/Text'
import TxnListItem from './TxnListItem'
import useActivityList from './useActivityList'
import NetTypeSegment from '../onboarding/NetTypeSegment'
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
import { useAppear } from '../../utils/useVisible'
import {
  useTransactionDetail,
  withTransactionDetail,
} from './TransactionDetail'

type AccountLayout = {
  accountViewStart: number
  accountViewHeight: number
}
type AccountLayoutAction = {
  type: 'accountViewLayout' | 'containerLayout'
  layout: LayoutRectangle
}
const initialState = {
  accountViewStart: 0,
  accountViewHeight: 0,
} as AccountLayout

function layoutReducer(state: AccountLayout, action: AccountLayoutAction) {
  switch (action.type) {
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
  const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
  const { backgroundStyle: handleStyle } = useOpacity('black500', 1)
  const { primaryText, primaryIcon } = useColors()
  const carouselRef = useRef<Carousel<CSAccount | null>>(null)
  const { sortedAccounts, currentAccount, setCurrentAccount } =
    useAccountStorage()
  const prevAccount = usePrevious(currentAccount)
  const prevSortedAccounts = usePrevious<CSAccount[] | undefined>(
    sortedAccounts,
  )
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')
  const [netType, setNetType] = useState<number>(NetType.MAINNET)
  const { show } = useAccountSelector()
  const { show: showTxnDetail } = useTransactionDetail()

  const { data: accountData, error: accountsError } = useAccountQuery({
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

  useAppear(fetchAccount)

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
    if (!accountsError && !activityError) return

    if (accountsError) {
      console.warn(accountsError)
    }
    if (activityError) {
      console.warn(activityError)
    }
  }, [accountsError, activityError])

  useEffect(() => {
    if (
      prevSortedAccounts &&
      sortedAccounts.length - prevSortedAccounts.length === 1
    ) {
      // We have a new account, snap to it
      const newAccount = sortedAccounts[sortedAccounts.length - 1]
      setCurrentAccount(newAccount)
      setOnboardingType('import')
    }
  }, [
    prevSortedAccounts,
    setCurrentAccount,
    sortedAccounts,
    sortedAccounts.length,
  ])

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(currentAccount?.address),
    [currentAccount],
  )

  const handleAddressBook = useCallback(() => {
    navigation.push('AddressBookNavigator')
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
      if (onboardingType === 'assign') return null
      return (
        <>
          <NetTypeSegment
            netType={netType}
            onSegmentChange={setNetType}
            padding="m"
          />
          <OnboardingSegment
            marginTop="s"
            padding="m"
            onSegmentChange={setOnboardingType}
            onboardingType={onboardingType}
          />
        </>
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
    const mid = wh - state.accountViewStart - state.accountViewHeight
    const expanded = wh - state.accountViewStart - spacing.l

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
    if (activityLoading) {
      return (
        <Box height={60} justifyContent="center">
          <ActivityIndicator color={primaryText} />
        </Box>
      )
    }
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
  }, [activityLoading, filterState.filter, primaryText, t])

  const requestMore = useCallback(() => {
    fetchMoreActivity()
  }, [fetchMoreActivity])

  const carouselWidths = useMemo(() => {
    const sliderWidth = wp(100)
    const itemWidth = sliderWidth - spacing.lx * 2
    return { sliderWidth, itemWidth }
  }, [spacing.lx])

  const handleAccountViewLayoutChange = useCallback(
    (layout: LayoutRectangle) =>
      dispatch({
        type: 'accountViewLayout',
        layout,
      }),
    [],
  )

  const handleActionSelected = useCallback(
    (type: Action) => {
      switch (type) {
        case 'send':
          navigation.navigate('PaymentScreen', {
            address: currentAccount?.address,
          })
          break
        case 'request':
          navigation.navigate('RequestScreen')
          break
        case 'payment':
          // TODO: Remove eventually
          if (accountNetType !== NetType.TESTNET) return
          navigation.navigate('WifiOnboard')
          break
        default:
          show()
          break
      }
    },
    [accountNetType, currentAccount, navigation, show],
  )

  const navToSettings = useCallback(
    () => navigation.navigate('SettingsNavigator'),
    [navigation],
  )

  return (
    <Box flex={1}>
      <Box minHeight={75} opacity={!currentAccount?.address ? 0 : 100}>
        <AnimatePresence>
          <MotiBox
            from={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <SafeAreaBox
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <TouchableOpacityBox
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
                <TestnetIcon color={primaryIcon} />
                <Text marginLeft="xs" variant="subtitle1" color="primaryIcon">
                  {t('onboarding.testnet')}
                </Text>
              </Box>
              <TouchableOpacityBox
                paddingHorizontal="l"
                onPress={handleAddressBook}
              >
                <AccountIco color={primaryIcon} />
              </TouchableOpacityBox>
            </SafeAreaBox>
          </MotiBox>
        </AnimatePresence>
      </Box>
      <Box marginTop={{ phone: 'ms', smallPhone: 'none' }}>
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
      <Box
        flex={1}
        onLayout={(e) =>
          dispatch({ type: 'containerLayout', layout: e.nativeEvent.layout })
        }
      >
        <AnimatePresence>
          {!currentAccount?.address && (
            <MotiBox
              position="absolute"
              top={0}
              bottom={0}
              left={0}
              right={0}
              from={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
            >
              <MultiAccountNavigator
                onboardingType={onboardingType}
                netType={netType}
              />
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
                  from={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                >
                  <AccountView
                    onLayoutChange={handleAccountViewLayoutChange}
                    onActionSelected={handleActionSelected}
                    visible={visible}
                    accountData={accountData?.account}
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
          <AccountActivityFilter {...filterState} />
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
    </Box>
  )
}

export default memo(withTransactionDetail(AccountsScreen))
