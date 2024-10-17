import ActivityIndicator from '@components/ActivityIndicator'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import FadeInOut, { DelayedFadeIn } from '@components/FadeInOut'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useRoute } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { useModal } from '@storage/ModalsProvider'
import { useColors } from '@theme/themeHooks'
import { GovMints, MIN_BALANCE_THRESHOLD } from '@utils/constants'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { WalletStackParamList } from '@services/WalletService/pages/WalletPage/WalletPageNavigator'
import { PublicKey } from '@solana/web3.js'
import ScrollBox from '@components/ScrollBox'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { Activity } from '../../types/activity'
import AccountActionBar from './AccountActionBar'
import { useActivityFilter } from './AccountActivityFilter'
import AccountTokenBalance from './AccountTokenBalance'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import TransactionDetailSelector, {
  TransactionDetailSelectorRef,
} from './TransactionDetail'
import TxnListItem from './TxnListItem'
import useSolanaActivityList from './useSolanaActivityList'
import { TokenListGovItem } from './TokenListItem'

const MIN_BOTTOM_BAR_HEIGHT = 80

type Route = RouteProp<WalletStackParamList, 'AccountTokenScreen'>

const AccountTokenScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const mintStr = useMemo(() => route.params.mint, [route.params.mint])
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const mint = usePublicKey(mintStr)!
  const wallet = useCurrentWallet()
  const { amount } = useOwnedAmount(wallet, mint)
  const { currentAccount } = useAccountStorage()
  const headerContainerRef = useRef<View>(null)
  const { cluster, isDevnet } = useSolana()
  const colors = useColors()
  const { showModal } = useModal()
  const [
    onEndReachedCalledDuringMomentum,
    setOnEndReachedCalledDuringMomentum,
  ] = useState(true)
  const transactionDetailsRef = useRef<TransactionDetailSelectorRef>(null)

  const { json, symbol } = useMetaplexMetadata(mint)

  const listStyle = useMemo(() => {
    return {
      backgroundColor: colors.primaryBackground,
      marginBottom: 100,
    }
  }, [colors])

  const filterState = useActivityFilter()

  const {
    data: activityData,
    requestMore: fetchMoreActivity,
    loading: activityLoading,
    now,
  } = useSolanaActivityList({
    account: currentAccount,
    filter: filterState.filter,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    mint: mint!,
  })

  const handleOnFetchMoreActivity = useCallback(() => {
    if (activityLoading || onEndReachedCalledDuringMomentum) return

    fetchMoreActivity()
    setOnEndReachedCalledDuringMomentum(true)
  }, [activityLoading, fetchMoreActivity, onEndReachedCalledDuringMomentum])

  const handleOnMomentumScrollBegin = useCallback(() => {
    setOnEndReachedCalledDuringMomentum(false)
  }, [])

  const showTransactionDetail = useCallback(
    (item: Activity) => {
      transactionDetailsRef?.current?.showTransaction({
        item,
        accountAddress: currentAccount?.address || '',
        mint,
      })
    },
    [currentAccount?.address, transactionDetailsRef, mint],
  )

  const hasAirdrop = useMemo(() => {
    if (cluster === 'devnet') {
      return (
        mint.equals(NATIVE_MINT) ||
        mint.equals(HNT_MINT) ||
        mint.equals(IOT_MINT) ||
        mint.equals(MOBILE_MINT)
      )
    }
    return false
  }, [mint, cluster])

  const keyExtractor = useCallback((item: Activity) => {
    return item.hash
  }, [])

  const renderItem = useCallback(
    ({ item, index }) => {
      const isFirst = index === 0
      const isLast = index === (activityData?.length || 0) - 1
      const borderTopStartRadius = isFirst ? 'xl' : 'none'
      const borderTopEndRadius = isFirst ? 'xl' : 'none'
      const borderBottomStartRadius = isLast ? 'xl' : 'none'
      const borderBottomEndRadius = isLast ? 'xl' : 'none'
      return (
        <FadeInOut>
          <TxnListItem
            mint={mint}
            onPress={showTransactionDetail}
            item={item}
            now={now}
            isLast={isLast}
            borderTopStartRadius={borderTopStartRadius}
            borderTopEndRadius={borderTopEndRadius}
            borderBottomStartRadius={borderBottomStartRadius}
            borderBottomEndRadius={borderBottomEndRadius}
          />
        </FadeInOut>
      )
    },
    [activityData?.length, mint, now, showTransactionDetail],
  )

  const renderFooter = useCallback(() => {
    if (!activityLoading) {
      return (
        <Box
          paddingVertical="4"
          paddingHorizontal="2"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          style={{
            marginTop: 0,
          }}
        >
          <Text
            variant="textMdRegular"
            color="secondaryText"
            textAlign="center"
            maxFontSizeMultiplier={1.3}
          >
            {t('accountsScreen.allFilterFooter')}
          </Text>
        </Box>
      )
    }

    return (
      <Box
        paddingVertical="6"
        paddingHorizontal="2"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
      >
        <ActivityIndicator animating={activityLoading} />
      </Box>
    )
  }, [activityLoading, t])

  const actionBarProps = useMemo(() => {
    let options = {
      hasSend: true,
      hasRequest: true,
      hasDelegate: false,
      compact: true,
      hasBottomTitle: true,
    }

    if (mint.equals(DC_MINT)) {
      options = {
        hasSend: false,
        hasRequest: false,
        hasDelegate: true,
        compact: false,
        hasBottomTitle: false,
      }
    }

    return options
  }, [mint])

  const renderHeader = useCallback(() => {
    const isGovMint = GovMints.some((m) => new PublicKey(m).equals(mint))

    return (
      <Box ref={headerContainerRef}>
        <Box>
          <Box marginBottom="4">
            <Box alignItems="center" marginBottom="4">
              <TokenIcon img={json?.image} size={50} />
            </Box>
            <Box paddingHorizontal="2">
              <AccountTokenBalance marginTop="2" mint={mint} />
              {!!symbol && (
                <AccountTokenCurrencyBalance
                  ticker={symbol.toUpperCase()}
                  variant="textXlRegular"
                  color="secondaryText"
                  textAlign="center"
                  marginBottom="8"
                />
              )}
              <AccountActionBar
                hasSend={actionBarProps.hasSend}
                hasRequest={actionBarProps.hasRequest}
                hasDelegate={actionBarProps.hasDelegate}
                mint={mint}
                compact={!mint.equals(DC_MINT)}
                hasBottomTitle={!mint.equals(DC_MINT)}
                hasAirdrop={hasAirdrop}
              />
            </Box>
          </Box>
        </Box>
        {mint.equals(NATIVE_MINT) &&
          !isDevnet &&
          (amount || 0) < MIN_BALANCE_THRESHOLD && (
            <>
              <Box
                mb="6"
                backgroundColor="warning.500"
                borderRadius="2xl"
                p="2"
              >
                <Text variant="textSmRegular" color="gray.950">
                  {t('accountsScreen.solWarning')}
                </Text>
                <TouchableOpacityBox
                  marginTop="4"
                  justifyContent="center"
                  alignItems="center"
                  backgroundColor="orange.500"
                  borderRadius="2xl"
                  onPress={() =>
                    showModal({ type: 'InsufficientSolConversion' })
                  }
                >
                  <Text variant="textMdRegular" padding="3" color="gray.950">
                    {t('accountsScreen.solSwap')}
                  </Text>
                </TouchableOpacityBox>
              </Box>
              <Box height={MIN_BOTTOM_BAR_HEIGHT} />
            </>
          )}

        {isGovMint && <TokenListGovItem mint={mint} marginBottom="4" />}
      </Box>
    )
  }, [
    actionBarProps,
    hasAirdrop,
    isDevnet,
    json?.image,
    mint,
    symbol,
    t,
    amount,
    showModal,
  ])

  return (
    <>
      <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
        <ScrollBox>
          <BackScreen
            flex={1}
            title={t('accountsScreen.title', {
              ticker: symbol,
            })}
            edges={[]}
            headerTopMargin="6xl"
          >
            <FlatList
              style={listStyle}
              keyExtractor={keyExtractor}
              directionalLockEnabled
              renderItem={renderItem}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              initialNumToRender={10}
              onEndReachedThreshold={0.01}
              onMomentumScrollBegin={handleOnMomentumScrollBegin}
              onEndReached={handleOnFetchMoreActivity}
              data={activityData}
            />
          </BackScreen>
        </ScrollBox>
        <TransactionDetailSelector ref={transactionDetailsRef} />
      </ReAnimatedBox>
    </>
  )
}

export default AccountTokenScreen
