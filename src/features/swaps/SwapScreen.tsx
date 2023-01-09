import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import Balance, { SolTokens, Ticker } from '@helium/currency'
import { useAsync } from 'react-async-hook'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useNavigation } from '@react-navigation/native'
import Text from '../../components/Text'
import Box from '../../components/Box'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import Refresh from '../../assets/images/refresh.svg'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useSpacing } from '../../theme/themeHooks'
import SwapItem from './SwapItem'
import BlurActionSheet from '../../components/BlurActionSheet'
import ListItem from '../../components/ListItem'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import ButtonPressable from '../../components/ButtonPressable'
import TextTransform from '../../components/TextTransform'
import {
  createTreasurySwapMessage,
  getConnection,
} from '../../utils/solanaUtils'
import { useAppStorage } from '../../storage/AppStorageProvider'
import * as Logger from '../../utils/logger'
import useLayoutHeight from '../../hooks/useLayoutHeight'
import { SwapNavigationProp } from './swapTypes'
import { useTreasuryPrice } from '../../hooks/useTreasuryPrice'
import { Mints } from '../../utils/hotspotNftsUtils'
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
  const spacing = useSpacing()
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

  const { price, loading: loadingPrice } = useTreasuryPrice(
    new PublicKey(Mints[youPayTokenType]),
    Number(youPayTokenAmount.bigInteger),
  )

  const [solFeeLayoutHeight, setSolFeeLayoutHeight] = useLayoutHeight()

  const showError = useMemo(() => {
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
  }, [hasInsufficientBalance, networkError, t])

  useAsync(async () => {
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
        >
          <Refresh width={16} height={16} />
        </TouchableOpacityBox>
      </Box>
    )
  }, [spacing.m, t])

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
          />
        ) : (
          <>
            <ListItem
              key="iot"
              title={Tokens.IOT}
              selected={youPayTokenType === Tokens.IOT}
              onPress={setTokenTypeHandler(Tokens.IOT)}
            />
            <ListItem
              key="mobile"
              title={Tokens.MOBILE}
              selected={youPayTokenType === Tokens.MOBILE}
              onPress={setTokenTypeHandler(Tokens.MOBILE)}
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
      return Balance.fromIntAndTicker(price, Tokens.HNT)
    }

    return Balance.fromIntAndTicker(0, Tokens.HNT)
  }, [price])

  const handleSwapTokens = useCallback(async () => {
    submitTreasurySwap(
      new PublicKey(Mints[youPayTokenType]),
      Number(youPayTokenAmount.bigInteger),
    )

    navigation.push('SwappingScreen', {
      tokenA: youPayTokenType,
      tokenB: youReceiveTokenType,
    })
  }, [
    navigation,
    submitTreasurySwap,
    youPayTokenAmount.bigInteger,
    youPayTokenType,
    youReceiveTokenType,
  ])

  return (
    <HNTKeyboard
      ref={hntKeyboardRef}
      onConfirmBalance={onConfirmBalance}
      ticker={youPayTokenType}
      networkFee={Balance.fromFloatAndTicker(solFee || 0.000005, Tokens.SOL)}
    >
      <ReAnimatedBox flex={1}>
        <SafeAreaBox edges={edges} flex={1}>
          {Header}
          <Box flexGrow={1} justifyContent="center">
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
              {solFee ? (
                <Box
                  position="absolute"
                  bottom={-spacing.m * 2}
                  left={0}
                  right={0}
                >
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
                <Box
                  position="absolute"
                  bottom={-spacing.m * 2}
                  left={0}
                  right={0}
                  onLayout={setSolFeeLayoutHeight}
                >
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
                </Box>
              )}
              <Box
                position="absolute"
                bottom={-spacing.m - solFeeLayoutHeight}
                left={0}
                right={0}
              >
                <Text
                  opacity={hasInsufficientBalance || networkError ? 100 : 0}
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
              disabled={youPayTokenAmount.integerBalance === 0}
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

export default SwapScreen
