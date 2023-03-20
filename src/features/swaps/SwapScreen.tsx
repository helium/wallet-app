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
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import ButtonPressable from '@components/ButtonPressable'
import TextTransform from '@components/TextTransform'
import { useTreasuryPrice } from '@hooks/useTreasuryPrice'
import useAlert from '@hooks/useAlert'
import TokenHNT from '@assets/images/tokenHNT.svg'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import TokenIOT from '@assets/images/tokenIOT.svg'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import {
  createTreasurySwapMessage,
  getConnection,
  TXN_FEE_IN_SOL,
} from '@utils/solanaUtils'
import { Mints } from '@utils/constants'
import { useAppStorage } from '@storage/AppStorageProvider'
import * as Logger from '@utils/logger'
import TokenSelector, { TokenSelectorRef } from '@components/TokenSelector'
import CloseButton from '@components/CloseButton'
import TreasuryWarningScreen from '@components/TreasuryWarningScreen'
import { SwapNavigationProp } from './swapTypes'
import useSubmitTxn from '../../graphql/useSubmitTxn'
import SwapItem from './SwapItem'

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
  const edges = useMemo(() => ['bottom'] as Edge[], [])
  const [selectorMode, setSelectorMode] = useState(SelectorMode.youPay)
  const [youPayTokenType, setYouPayTokenType] = useState<Ticker>(Tokens.MOBILE)
  /* TODO: Add new solana variation for IOT and MOBILE in @helium/currency that supports
     6 decimals and pulls from mint instead of ticker.
  */
  const [youPayTokenAmount, setYouPayTokenAmount] = useState<number>(0)
  const [youReceiveTokenType, setYouReceiveTokenType] = useState<Ticker>(
    Tokens.HNT,
  )
  const [solFee, setSolFee] = useState<number | undefined>(undefined)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState<
    undefined | boolean
  >()
  const [networkError, setNetworkError] = useState<undefined | string>()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const { showOKCancelAlert } = useAlert()
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const {
    price,
    loading: loadingPrice,
    freezeDate,
  } = useTreasuryPrice(new PublicKey(Mints[youPayTokenType]), youPayTokenAmount)

  // If user does not have enough tokens to swap for greater than 0.00000001 tokens
  const insufficientTokensToSwap = useMemo(() => {
    return !(price && price > 0) && youPayTokenAmount > 0
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
    setYouPayTokenAmount(0)
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

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  useAsync(async () => {
    refresh()
  }, [])

  const Header = useMemo(() => {
    return (
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        marginTop="l"
      >
        <CloseButton marginStart="m" onPress={handleClose} />
        <Text variant="h4" color="white" flex={1} textAlign="center">
          {t('swapsScreen.title')}
        </Text>
        <TouchableOpacityBox padding="m" marginEnd="s" onPress={refresh}>
          <Refresh width={16} height={16} />
        </TouchableOpacityBox>
      </Box>
    )
  }, [refresh, t, handleClose])

  const setTokenTypeHandler = useCallback(
    (ticker: Ticker) => {
      if (selectorMode === SelectorMode.youPay) {
        refresh()
        setYouPayTokenType(ticker)
      } else {
        setYouReceiveTokenType(ticker)
      }
    },
    [selectorMode, refresh],
  )

  const tokenData = useMemo(() => {
    const tokens = {
      [SelectorMode.youPay]: [
        {
          label: Tokens.MOBILE,
          icon: <TokenMOBILE width={30} height={30} />,
          value: Tokens.MOBILE,
          selected: youPayTokenType === Tokens.MOBILE,
        },
        {
          label: Tokens.IOT,
          icon: <TokenIOT width={30} height={30} />,
          value: Tokens.IOT,
          selected: youPayTokenType === Tokens.IOT,
        },
      ],
      [SelectorMode.youReceive]: [
        {
          label: Tokens.HNT,
          icon: <TokenHNT width={30} height={30} />,
          value: Tokens.HNT,
          selected: youPayTokenType === Tokens.HNT,
        },
      ],
    }

    return tokens[selectorMode]
  }, [selectorMode, youPayTokenType])

  const onCurrencySelect = useCallback(
    (youPay: boolean) => () => {
      tokenSelectorRef.current?.showTokens()
      setSelectorMode(youPay ? SelectorMode.youPay : SelectorMode.youReceive)
    },
    [],
  )

  const onTokenItemPressed = useCallback(() => {
    hntKeyboardRef.current?.show({
      payer: currentAccount,
    })
  }, [currentAccount])

  const onConfirmBalance = useCallback(
    ({ balance }: { balance: Balance<SolTokens> }) => {
      const amount = balance.floatBalance.valueOf()
      setYouPayTokenAmount(amount)
    },
    [],
  )

  const youReceiveTokenAmount = useMemo(() => {
    if (price) {
      return price
    }

    return 0
  }, [price])

  const handleSwapTokens = useCallback(async () => {
    const decision = await showOKCancelAlert({
      title: t('swapsScreen.swapAlertTitle'),
      message: t('swapsScreen.swapAlertBody'),
    })
    if (!decision) return

    submitTreasurySwap(new PublicKey(Mints[youPayTokenType]), youPayTokenAmount)

    navigation.push('SwappingScreen', {
      tokenA: youPayTokenType,
      tokenB: youReceiveTokenType,
    })
  }, [
    navigation,
    showOKCancelAlert,
    submitTreasurySwap,
    t,
    youPayTokenAmount,
    youPayTokenType,
    youReceiveTokenType,
  ])

  return (
    <TreasuryWarningScreen>
      <HNTKeyboard
        ref={hntKeyboardRef}
        onConfirmBalance={onConfirmBalance}
        ticker={youPayTokenType}
        networkFee={Balance.fromFloatAndTicker(
          solFee || TXN_FEE_IN_SOL,
          Tokens.SOL,
        )}
      >
        <TokenSelector
          ref={tokenSelectorRef}
          onTokenSelected={setTokenTypeHandler}
          tokenData={tokenData}
        >
          <ReAnimatedBox flex={1}>
            <SafeAreaBox backgroundColor="black900" edges={edges} flex={1}>
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
                    youPayTokenAmount === 0 ||
                    treasuryFrozen
                  }
                  titleColorPressedOpacity={0.3}
                  title={t('swapsScreen.swapTokens')}
                  titleColor="black"
                  onPress={handleSwapTokens}
                />
              </Box>
            </SafeAreaBox>
          </ReAnimatedBox>
        </TokenSelector>
      </HNTKeyboard>
    </TreasuryWarningScreen>
  )
}

export default memo(SwapScreen)
