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
import { Activity, useAccountQuery } from '../../generated/graphql'
import SafeAreaBox from '../../components/SafeAreaBox'
import * as AccountUtils from '../../utils/accountUtils'
import { useAccountSelector } from '../../components/AccountSelector'

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
  const bottomSheetRef = useRef<BottomSheet>(null)
  const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
  const { backgroundStyle: handleStyle } = useOpacity('black500', 1)
  const { primaryText, primaryIcon } = useColors()
  const carouselRef = useRef<Carousel<CSAccount | null>>(null)
  const { sortedAccounts, currentAccount, setCurrentAccount } =
    useAccountStorage()
  const prevSortedAccounts = usePrevious<CSAccount[] | undefined>(
    sortedAccounts,
  )
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')
  const [netType, setNetType] = useState<number>(NetType.MAINNET)
  const { show } = useAccountSelector()

  const { data: accountData, error: accountsError } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
  })

  const {
    data: activityData,
    error: activityError,
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useActivityList({
    address: currentAccount?.address,
    skip: !currentAccount?.address,
  })

  useEffect(() => {
    if (!accountsError && !activityError) return

    if (accountsError) {
      console.error(accountsError)
    }
    if (activityError) {
      console.error(activityError)
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

  const renderFlatlistItem = useCallback(
    ({ item }: Item) => {
      return (
        <TxnListItem
          item={item}
          accountAddress={currentAccount?.address}
          now={now}
        />
      )
    },
    [currentAccount, now],
  )

  const renderSeparator = useCallback(() => {
    return <Box height={1} width="100%" backgroundColor="primaryBackground" />
  }, [])

  const keyExtractor = useCallback((item: Activity) => {
    return item.hash
  }, [])

  const header = useMemo(() => {
    return (
      <Box borderBottomColor="primaryBackground" borderBottomWidth={1}>
        <Text
          variant="body1"
          color="surfaceSecondaryText"
          marginHorizontal="l"
          marginBottom="m"
        >
          {t('accountsScreen.myTransactions')}
        </Text>
      </Box>
    )
  }, [t])

  const footer = useMemo(() => {
    if (!activityLoading) return null
    return (
      <Box height={60} justifyContent="center">
        <ActivityIndicator color={primaryText} />
      </Box>
    )
  }, [activityLoading, primaryText])

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
        case 'payment':
          navigation.navigate('PaymentScreen', {
            address: currentAccount?.address,
          })
          break
        case 'stake':
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
                    address={d?.address || ''}
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
      {/* TODO: Handle pending txns and filter? */}
      {currentAccount && !!currentAccount?.address && snapPoints.length > 0 && (
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          backgroundStyle={backgroundStyle}
          handleIndicatorStyle={handleStyle}
        >
          <BottomSheetFlatList
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            ItemSeparatorComponent={renderSeparator}
            data={activityData?.accountActivity?.data || ([] as Activity[])}
            renderItem={renderFlatlistItem}
            keyExtractor={keyExtractor}
            onEndReached={requestMore}
          />
        </BottomSheet>
      )}
    </Box>
  )
}

export default memo(AccountsScreen)
