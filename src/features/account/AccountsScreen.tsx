import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useApolloClient, useQuery } from '@apollo/client'
import { Carousel } from 'react-native-snap-carousel'
import CogIco from '@assets/images/cog.svg'
import AccountIco from '@assets/images/account.svg'
import { AnimatePresence } from 'moti'
import { ActivityIndicator, LayoutRectangle } from 'react-native'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import Box from '../../components/Box'
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar'
import { ACCOUNTS_WALLET_QUERY } from '../../graphql/account'
import {
  Accounts,
  AccountsVariables,
  Accounts_accounts,
} from '../../graphql/__generated__/Accounts'
import { AccountActivity_accountActivity_data } from '../../graphql/__generated__/AccountActivity'
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
import AccountView from './AccountView'
import Text from '../../components/Text'
import TxnListItem from './TxnListItem'
import useActivityList from './useActivityList'

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
  item: AccountActivity_accountActivity_data
  index: number
}

const AccountImportCreate = 'accountImportCreate'
const AccountsScreen = () => {
  const spacing = useSpacing()
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(layoutReducer, initialState)
  const bottomSheetRef = useRef<BottomSheet>(null)
  const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
  const { backgroundStyle: handleStyle } = useOpacity('black600', 1)

  const { sortedAccounts, accountAddresses, signOut } = useAccountStorage()
  const prevSortedAccounts = usePrevious<CSAccount[] | undefined>(
    sortedAccounts,
  )
  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')
  const [currentAccount, setCurrentAccount] = useState<CSAccount>()
  const { black700, primaryText } = useColors()
  const client = useApolloClient()

  const { data: accountsData, error: accountsError } = useQuery<
    Accounts,
    AccountsVariables
  >(ACCOUNTS_WALLET_QUERY, {
    variables: { addresses: accountAddresses },
    fetchPolicy: 'cache-and-network',
    skip: !accountAddresses,
  })

  const {
    data: activityData,
    error: activityError,
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useActivityList(currentAccount?.address)

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
    accountAddresses,
    prevSortedAccounts,
    sortedAccounts,
    sortedAccounts.length,
  ])

  const handleSignOut = useCallback(() => {
    // TODO: Signout needs to be moved to a settings page
    // Will we reset the whole store or only certain queries?
    client.resetStore()
    signOut()
  }, [client, signOut])

  const carouselData = useMemo(() => {
    return [
      ...sortedAccounts,
      { alias: AccountImportCreate, address: AccountImportCreate },
    ]
  }, [sortedAccounts])

  const renderCarouselItem = ({ item }: { item: CSAccount }) => {
    if (item.address === AccountImportCreate) {
      if (onboardingType === 'assign') return null
      return (
        <OnboardingSegment
          minHeight={88}
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
    [carouselData],
  )

  const snapPoints = useMemo(() => {
    const mid = wh - state.accountViewStart - state.accountViewHeight
    const expanded = wh - state.accountViewStart - spacing.l

    if (mid <= 0 || expanded <= 0) return ['5%']
    return [mid, expanded]
  }, [spacing.l, state])

  const accountWalletData = useMemo(() => {
    return accountsData?.accounts?.reduce((obj, val) => {
      if (!val) return obj
      return { ...obj, [val.address]: val }
    }, {} as Record<string, Accounts_accounts>)
  }, [accountsData])

  useEffect(() => {
    if (currentAccount || !carouselData.length) return
    setCurrentAccount(carouselData[0])
  }, [carouselData, currentAccount])

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

  const keyExtractor = useCallback(
    (item: AccountActivity_accountActivity_data) => {
      return item.hash
    },
    [],
  )

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

  return (
    <Box flex={1}>
      <FocusAwareStatusBar hidden />

      <Box minHeight={75}>
        <AnimatePresence>
          {currentAccount?.address !== AccountImportCreate && (
            <MotiBox
              flexDirection="row"
              flex={1}
              justifyContent="space-between"
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
              <TouchableOpacityBox padding="l">
                <CogIco color={black700} />
              </TouchableOpacityBox>
              <TouchableOpacityBox padding="l" onPress={handleSignOut}>
                <AccountIco color={black700} />
              </TouchableOpacityBox>
            </MotiBox>
          )}
        </AnimatePresence>
      </Box>
      <Box marginTop={{ phone: 'ms', smallPhone: 'none' }}>
        <Carousel
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
          {currentAccount?.address === AccountImportCreate && (
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
              <MultiAccountNavigator onboardingType={onboardingType} />
            </MotiBox>
          )}
        </AnimatePresence>
        {carouselData.map((d, i) => {
          if (i === carouselData.length - 1) return null
          const visible =
            currentAccount &&
            currentAccount?.address !== AccountImportCreate &&
            currentAccount.address === d.address
          return (
            <AnimatePresence key={d.address}>
              {visible && (
                <MotiBox
                  key={d.address}
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
                    address={d.address}
                    onLayoutChange={(layout) =>
                      dispatch({
                        type: 'accountViewLayout',
                        layout,
                      })
                    }
                    visible={visible}
                    accountData={accountWalletData?.[d.address]}
                  />
                </MotiBox>
              )}
            </AnimatePresence>
          )
        })}
      </Box>
      {/* TODO: Handle pending txns and filter? */}
      {currentAccount &&
        currentAccount?.address !== AccountImportCreate &&
        snapPoints.length > 0 && (
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
              data={
                activityData?.accountActivity?.data ||
                ([] as AccountActivity_accountActivity_data[])
              }
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
