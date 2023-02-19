import React, { useCallback, useMemo, useRef, useState, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import Balance, { SolTokens, Ticker } from '@helium/currency'
import { useAsync } from 'react-async-hook'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useNavigation } from '@react-navigation/native'
import Refresh from '@assets/images/refresh.svg'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Text from '@components/Text'
import Box from '@components/Box'
import { ReAnimatedBox } from '@components/AnimatedBox'
import SafeAreaBox from '@components/SafeAreaBox'
import BlurActionSheet from '@components/BlurActionSheet'
import ListItem from '@components/ListItem'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import ButtonPressable from '@components/ButtonPressable'
import TextTransform from '@components/TextTransform'
import { useTreasuryPrice } from '@hooks/useTreasuryPrice'
import useAlert from '@hooks/useAlert'
import { useSpacing } from '@theme/themeHooks'
import SwapItem from './SwapItem'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  createTreasurySwapMessage,
  getConnection,
  TXN_FEE_IN_SOL,
} from '../../utils/solanaUtils'
import { Mints } from '../../utils/constants'
import { useAppStorage } from '../../storage/AppStorageProvider'
import * as Logger from '../../utils/logger'
import { SwapNavigationProp } from './swapTypes'
import useSubmitTxn from '../../graphql/useSubmitTxn'

// Selector Mode enum
enum SelectorMode {
  youPay = 'youPay',
  youReceive = 'youReceive',
}

enum Tokens {
  HNT = 'HNT',
  MOBILE = 'MOBILE',
  IOT = 'IOT',
  SOL = 'SOL',
}

const SwapScreen = () => {
  const { t } = useTranslation()
  const { currentAccount, anchorProvider } = useAccountStorage()
  const { solanaNetwork: cluster } = useAppStorage()
  const navigation = useNavigation<SwapNavigationProp>()
  const { submitTreasurySwap } = useSubmitTxn()
  const edges = useMemo(() => ['top'] as Edge[], [])
  const [tokenSheetOpen, setTokenSheetOpen] = useState(false)
  const [selectorMode, setSelectorMode] = useState(SelectorMode.youPay)
  const [youPayTokenType, setYouPayTokenType] = useState<Ticker>(Tokens.MOBILE)
  const [youPayTokenAmount, setYouPayTokenAmount] = useState<
    Balance<SolTokens>
  >(Balance.fromIntAndTicker(0, Tokens.MOBILE))
  const [youReceiveTokenType, setYouReceiveTokenType] = useState<Ticker>(
    Tokens.HNT,
  )
  const [solFee, setSolFee] = useState<number | undefined>(undefined)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState<
    undefined | boolean
  >()
  const [networkError, setNetworkError] = useState<undefined | string>()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const spacing = useSpacing()
  const { showOKCancelAlert } = useAlert()
  const {
    price,
    loading: loadingPrice,
    freezeDate,
  } = useTreasuryPrice(
    new PublicKey(Mints[youPayTokenType]),
    Number(youPayTokenAmount.floatBalance),
  )

  // If user does not have enough tokens to swap for greater than 0.00000001 tokens
  const insufficientTokensToSwap = useMemo(() => {
    return !(price && price > 0) && youPayTokenAmount.floatBalance > 0
  }, [price, youPayTokenAmount])

  const showError = useMemo(() => {
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
    if (insufficientTokensToSwap)
      return t('swapsScreen.insufficientTokensToSwap')
  }, [hasInsufficientBalance, insufficientTokensToSwap, networkError, t])

  const treasuryFrozen = useMemo(() => {
    if (!freezeDate) return false
    return freezeDate.getTime() > Date.now()
  }, [freezeDate])

  const refresh = useCallback(async () => {
    setYouPayTokenAmount(Balance.fromIntAndTicker(0, Tokens.MOBILE))
    setYouReceiveTokenType(Tokens.HNT)
    setYouPayTokenType(Tokens.MOBILE)
    setSelectorMode(SelectorMode.youPay)
    setSolFee(undefined)
    setHasInsufficientBalance(undefined)
    setNetworkError(undefined)

    if (!currentAccount?.solanaAddress || !anchorProvider) return
    const connection = getConnection(cluster)

    try {
      const { message } = await createTreasurySwapMessage(
        cluster,
        0,
        new PublicKey(Mints.MOBILE),
        anchorProvider,
      )

      const response = await connection.getFeeForMessage(
        message,
        'singleGossip',
      )
      setSolFee(response.value / LAMPORTS_PER_SOL)

      const balance = await connection.getBalance(
        new PublicKey(currentAccount?.solanaAddress),
      )
      setHasInsufficientBalance(response.value > balance)
    } catch (error) {
      Logger.error(error)
      setNetworkError((error as Error).message)
    }
  }, [anchorProvider, cluster, currentAccount])

  useAsync(async () => {
    refresh()
  }, [])

  const toggleTokenSheetsOpen = useCallback(
    (open: boolean) => () => {
      setTokenSheetOpen(open)
    },
    [],
  )

  const Header = useMemo(() => {
    return (
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        marginTop="l"
      >
        <Text variant="h4" color="white">
          {t('swapsScreen.title')}
        </Text>
        <TouchableOpacityBox
          position="absolute"
          top={-spacing.m / 2}
          right={spacing.m}
          padding="m"
          onPress={refresh}
        >
          <Refresh width={16} height={16} />
        </TouchableOpacityBox>
      </Box>
    )
  }, [refresh, spacing.m, t])

  const setTokenTypeHandler = useCallback(
    (ticker: Ticker) => () => {
      setTokenSheetOpen(false)
      if (selectorMode === SelectorMode.youPay) {
        setYouPayTokenType(ticker)
      } else {
        setYouReceiveTokenType(ticker)
      }
    },
    [selectorMode],
  )

  const tokenTypes = useCallback(
    () => (
      <>
        {selectorMode === SelectorMode.youReceive ? (
          <ListItem
            key="hnt"
            title={Tokens.HNT}
            selected={youReceiveTokenType === Tokens.HNT}
            onPress={setTokenTypeHandler(Tokens.HNT)}
            hasPressedState={false}
          />
        ) : (
          <>
            <ListItem
              key="iot"
              title={Tokens.IOT}
              selected={youPayTokenType === Tokens.IOT}
              onPress={setTokenTypeHandler(Tokens.IOT)}
              hasPressedState={false}
            />
            <ListItem
              key="mobile"
              title={Tokens.MOBILE}
              selected={youPayTokenType === Tokens.MOBILE}
              onPress={setTokenTypeHandler(Tokens.MOBILE)}
              hasPressedState={false}
            />
          </>
        )}
      </>
    ),
    [selectorMode, setTokenTypeHandler, youPayTokenType, youReceiveTokenType],
  )

  const onCurrencySelect = useCallback(
    (youPay: boolean) => () => {
      setTokenSheetOpen(true)
      setSelectorMode(youPay ? SelectorMode.youPay : SelectorMode.youReceive)
    },
    [],
  )

  const onTokenItemPressed = useCallback(() => {
    hntKeyboardRef.current?.show({
      payer: currentAccount,
    })
  }, [currentAccount])

  const onConfirmBalance = useCallback((opts) => {
    setYouPayTokenAmount(opts.balance)
  }, [])

  const youReceiveTokenAmount = useMemo(() => {
    if (price) {
      return Balance.fromFloatAndTicker(price, Tokens.HNT)
    }

    return Balance.fromIntAndTicker(0, Tokens.HNT)
  }, [price])

  const handleSwapTokens = useCallback(async () => {
    const decision = await showOKCancelAlert({
      title: t('swapsScreen.swapAlertTitle'),
      message: t('swapsScreen.swapAlertBody'),
    })
    if (!decision) return

    submitTreasurySwap(
      new PublicKey(Mints[youPayTokenType]),
      Number(youPayTokenAmount.floatBalance),
    )

    navigation.push('SwappingScreen', {
      tokenA: youPayTokenType,
      tokenB: youReceiveTokenType,
    })
  }, [
    navigation,
    showOKCancelAlert,
    submitTreasurySwap,
    t,
    youPayTokenAmount.floatBalance,
    youPayTokenType,
    youReceiveTokenType,
  ])

  return (
    <HNTKeyboard
      usePortal
      ref={hntKeyboardRef}
      onConfirmBalance={onConfirmBalance}
      ticker={youPayTokenType}
      networkFee={Balance.fromFloatAndTicker(
        solFee || TXN_FEE_IN_SOL,
        Tokens.SOL,
      )}
    >
      <ReAnimatedBox flex={1}>
        <SafeAreaBox edges={edges} flex={1}>
          {Header}
          <Box flexGrow={1} justifyContent="center" marginTop="xxxl">
            <SwapItem
              onPress={onTokenItemPressed}
              marginHorizontal="m"
              isPaying
              onCurrencySelect={onCurrencySelect(true)}
              currencySelected={youPayTokenType}
              amount={youPayTokenAmount}
            />
            <Box>
              <SwapItem
                disabled
                marginTop="xxl"
                marginHorizontal="m"
                isPaying={false}
                onCurrencySelect={onCurrencySelect(false)}
                currencySelected={youReceiveTokenType}
                amount={youReceiveTokenAmount}
                loading={loadingPrice}
              />

              <Box marginTop="m">
                {solFee ? (
                  <Box marginTop="m">
                    <TextTransform
                      textAlign="center"
                      marginHorizontal="m"
                      variant="body3Medium"
                      color="white"
                      i18nKey="collectablesScreen.transferFee"
                      values={{ amount: solFee }}
                    />
                  </Box>
                ) : (
                  <Text
                    marginTop="m"
                    textAlign="center"
                    marginHorizontal="m"
                    variant="body2"
                    marginBottom="s"
                    color="secondaryText"
                  >
                    {t('generic.calculatingTransactionFee')}
                  </Text>
                )}
                <Text
                  marginTop="s"
                  opacity={
                    insufficientTokensToSwap ||
                    hasInsufficientBalance ||
                    networkError
                      ? 100
                      : 0
                  }
                  marginHorizontal="m"
                  variant="body3Medium"
                  color="red500"
                  textAlign="center"
                >
                  {showError}
                </Text>
              </Box>
            </Box>
          </Box>

          <Box
            flexDirection="row"
            marginBottom="xl"
            marginTop="m"
            marginHorizontal="xl"
          >
            <ButtonPressable
              height={65}
              flexGrow={1}
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacity={1}
              backgroundColorOpacityPressed={0.05}
              titleColorDisabled="grey600"
              backgroundColorDisabled="white"
              backgroundColorDisabledOpacity={0.1}
              disabled={
                insufficientTokensToSwap ||
                youPayTokenAmount.integerBalance === 0 ||
                treasuryFrozen
              }
              titleColorPressedOpacity={0.3}
              title={t('swapsScreen.swapTokens')}
              titleColor="black"
              onPress={handleSwapTokens}
            />
          </Box>
        </SafeAreaBox>
        <BlurActionSheet
          title={
            selectorMode === SelectorMode.youPay
              ? t('swapsScreen.chooseTokenToSwap')
              : t('swapsScreen.chooseTokenToReceive')
          }
          open={tokenSheetOpen}
          onClose={toggleTokenSheetsOpen(false)}
        >
          {tokenTypes()}
        </BlurActionSheet>
      </ReAnimatedBox>
    </HNTKeyboard>
  )
}

export default memo(SwapScreen)
