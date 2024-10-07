import Menu from '@assets/images/menu.svg'
import Plus from '@assets/images/plus.svg'
import Refresh from '@assets/images/refresh.svg'
import AddressBookSelector, {
  AddressBookRef,
} from '@components/AddressBookSelector'
import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import CloseButton from '@components/CloseButton'
import { FadeInFast } from '@components/FadeInOut'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TextTransform from '@components/TextTransform'
import TokenSelector, { TokenSelectorRef } from '@components/TokenSelector'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import {
  useMint,
  useOwnedAmount,
  useSolOwnedAmount,
} from '@helium/helium-react-hooks'
import {
  DC_MINT,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  toBN,
  toNumber,
  truthy,
} from '@helium/spl-utils'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { useTreasuryPrice } from '@hooks/useTreasuryPrice'
import { useNavigation } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useJupiter } from '@storage/JupiterProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { CSAccount } from '@storage/cloudStorage'
import { useColors, useHitSlop, useSpacing } from '@theme/themeHooks'
import { useBalance } from '@utils/Balance'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import {
  TXN_FEE_IN_LAMPORTS,
  getAtaAccountCreationFee,
  humanReadable,
} from '@utils/solanaUtils'
import BN from 'bn.js'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  LayoutAnimation,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native'
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { solAddressIsValid } from '../../utils/accountUtils'
import SwapItem from './SwapItem'
import { SwapNavigationProp } from './swapTypes'
import ScrollBox from '@components/ScrollBox'
import { NavBarHeight } from '@components/ServiceNavBar'

const SOL_TXN_FEE = new BN(TXN_FEE_IN_LAMPORTS)

// Selector Mode enum
enum SelectorMode {
  youPay = 'youPay',
  youReceive = 'youReceive',
}

const SwapScreen = () => {
  const { t } = useTranslation()
  const { bottom } = useSafeAreaInsets()
  const spacing = useSpacing()
  const { currentAccount } = useAccountStorage()
  const { isDevnet, anchorProvider, connection } = useSolana()
  const wallet = useCurrentWallet()
  const colors = useColors()
  const navigation = useNavigation<SwapNavigationProp>()
  const { submitJupiterSwap, submitTreasurySwap, submitMintDataCredits } =
    useSubmitTxn()
  const edges = useMemo(() => ['bottom'] as Edge[], [])
  const [selectorMode, setSelectorMode] = useState(SelectorMode.youPay)
  const [inputMint, setInputMint] = useState<PublicKey>(MOBILE_MINT)
  const [inputAmount, setInputAmount] = useState<number>(0)
  const [outputMint, setOutputMint] = useState<PublicKey>(HNT_MINT)
  const [outputAmount, setOutputAmount] = useState<number>(0)
  const [priceImpact, setPriceImpact] = useState<number>(0)
  const [slippageBps, setSlippageBps] = useState<number>(50)
  const [slippageInfoVisible, setSlippageInfoVisible] = useState(false)
  const [routeNotFound, setRouteNotFound] = useState(false)
  const [solFee, setSolFee] = useState<BN>(SOL_TXN_FEE)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState<
    undefined | boolean
  >()
  const [networkError, setNetworkError] = useState<undefined | string>()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const inputMintBalance = useBN(useOwnedAmount(wallet, inputMint).amount)
  const { networkTokensToDc, dcToNetworkTokens } = useBalance()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const addressBookRef = useRef<AddressBookRef>(null)
  const [swapping, setSwapping] = useState(false)
  const [transactionError, setTransactionError] = useState<undefined | string>()
  const [hasRecipientError, setHasRecipientError] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [isRecipientOpen, setRecipientOpen] = useState(false)
  const { visibleTokens } = useVisibleTokens()
  const { loading, error: jupiterError, getRoute, getSwapTx } = useJupiter()
  const { price, loading: loadingPrice } = useTreasuryPrice(
    inputMint,
    inputAmount,
  )

  const inputMintAcc = useMint(inputMint)?.info
  const outputMintAcc = useMint(outputMint)?.info

  const validInputMints = useMemo(() => {
    if (isDevnet)
      return [HNT_MINT.toBase58(), MOBILE_MINT.toBase58(), IOT_MINT.toBase58()]
    return [...visibleTokens].filter(truthy)
  }, [visibleTokens, isDevnet])

  const validOutputMints = useMemo(() => {
    if (isDevnet) {
      if (HNT_MINT.equals(inputMint)) return [DC_MINT.toBase58()]
      return [HNT_MINT.toBase58()]
    }

    return [...visibleTokens].filter(truthy)
  }, [inputMint, visibleTokens, isDevnet])

  const handleRecipientClick = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setRecipientOpen(!isRecipientOpen)
  }, [isRecipientOpen, setRecipientOpen])

  const handleAddressBookSelected = useCallback(() => {
    addressBookRef?.current?.showAddressBook({})
  }, [])

  const handleContactSelected = useCallback(
    ({ contact }: { contact: CSAccount; prevAddress?: string }) => {
      if (!contact.solanaAddress) return
      setRecipient(contact.solanaAddress)
      setHasRecipientError(false)
    },
    [],
  )
  const hitSlop = useHitSlop('6')

  const handleEditAddress = useCallback((text?: string) => {
    setRecipient(text || '')
    setHasRecipientError(false)
  }, [])

  const insufficientTokensToSwap = useMemo(() => {
    if (inputAmount > 0 && inputMintAcc) {
      return inputMintBalance?.lt(toBN(inputAmount || 0, inputMintAcc.decimals))
    }
  }, [inputAmount, inputMintBalance, inputMintAcc])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showError: any = useMemo(() => {
    if (hasRecipientError) return t('generic.notValidSolanaAddress')
    if (insufficientTokensToSwap)
      return t('swapsScreen.insufficientTokensToSwap')
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
    if (transactionError) return transactionError
    if (jupiterError) return jupiterError
    if (routeNotFound) return t('swapsScreen.routeNotFound')
  }, [
    hasRecipientError,
    t,
    insufficientTokensToSwap,
    hasInsufficientBalance,
    networkError,
    transactionError,
    jupiterError,
    routeNotFound,
  ])

  const refresh = useCallback(async () => {
    setInputAmount(0)
    setOutputAmount(0)
    setPriceImpact(0)
    setInputMint(MOBILE_MINT)
    setOutputMint(HNT_MINT)
    setSolFee(SOL_TXN_FEE)
    setRecipient('')
    setRecipientOpen(false)
    setSelectorMode(SelectorMode.youPay)
    setNetworkError(undefined)
  }, [])

  useAsync(async () => {
    if (
      !currentAccount?.solanaAddress ||
      !anchorProvider ||
      !connection ||
      !solBalance
    )
      return

    let fee = new BN(TXN_FEE_IN_LAMPORTS)

    const ataFee = await getAtaAccountCreationFee({
      solanaAddress: currentAccount.solanaAddress,
      connection,
      mint: outputMint,
    })
    fee = fee.add(ataFee)

    setSolFee(fee)

    setHasInsufficientBalance(
      fee.gt(solBalance || new BN(0)) || solBalance?.lt(new BN(5000)),
    )
  }, [
    anchorProvider,
    currentAccount?.solanaAddress,
    solBalance,
    inputMint,
    outputMint,
  ])

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  useAsync(async () => {
    refresh()
  }, [])

  useEffect(() => {
    // ensure outputMint can be swapable to inputMint
    if (!inputMint.equals(HNT_MINT) && !outputMint.equals(DC_MINT)) {
      if (
        validOutputMints &&
        validOutputMints[0] &&
        !validOutputMints?.includes(outputMint?.toBase58() || '')
      ) {
        setOutputMint(new PublicKey(validOutputMints[0]))
      }
    }
  }, [inputMint, outputMint, validOutputMints])

  const Header = useMemo(() => {
    return (
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap="2.5"
      >
        <TouchableOpacityBox onPress={refresh}>
          <Image source={require('@assets/images/swapIcon.png')} />
        </TouchableOpacityBox>
        <Text
          variant="displaySmSemibold"
          color="primaryText"
          flex={1}
          textAlign="center"
        >
          {t('swapsScreen.title')}
        </Text>
        <Text
          variant="textLgMedium"
          color="fg.quaternary-500"
          flex={1}
          textAlign="center"
        >
          {t('swapsScreen.subtitle')}
        </Text>
      </Box>
    )
  }, [refresh, t, handleClose])

  const Slippage = useMemo(() => {
    if (isDevnet) {
      return null
    }

    const bpsOptions: number[] = [30, 50, 100]
    const disabled = outputMint.equals(DC_MINT)

    return (
      <Box
        flexDirection="row"
        borderRadius="2xl"
        marginHorizontal="4"
        opacity={disabled ? 0.3 : 1}
        backgroundColor={'cardBackground'}
      >
        <TouchableOpacityBox
          flex={1}
          borderEndWidth={2}
          borderColor="primaryBackground"
          alignItems="center"
          justifyContent="center"
          alignContent="center"
          flexDirection="row"
          paddingHorizontal="3"
          onPress={() => setSlippageInfoVisible(true)}
        >
          <Text variant="textXsMedium" color="secondaryText">
            {t('swapsScreen.slippage')}
          </Text>
        </TouchableOpacityBox>

        {bpsOptions.map((bps, idx) => {
          const isLast = idx === bpsOptions.length - 1
          const isActive = slippageBps === bps

          return (
            <TouchableOpacityBox
              disabled={disabled}
              key={bps}
              flex={1}
              padding="3"
              alignItems="center"
              borderEndWidth={isLast ? 0 : 2}
              borderTopRightRadius={isLast ? '4xl' : 'none'}
              borderBottomRightRadius={isLast ? '4xl' : 'none'}
              borderColor={'primaryBackground'}
              backgroundColor={
                !disabled && isActive ? 'secondaryBackground' : 'cardBackground'
              }
              onPress={() => setSlippageBps(bps)}
            >
              <Text
                variant="textXsMedium"
                color={isActive ? 'primaryText' : 'secondaryText'}
              >
                {bps / 100}%
              </Text>
            </TouchableOpacityBox>
          )
        })}
      </Box>
    )
  }, [
    slippageBps,
    setSlippageBps,
    outputMint,
    setSlippageInfoVisible,
    t,
    isDevnet,
  ])

  const setTokenTypeHandler = useCallback(
    (mint: PublicKey) => {
      if (selectorMode === SelectorMode.youPay) {
        refresh()

        if (mint.equals(outputMint)) {
          setOutputMint(inputMint)
        }
        setInputMint(mint)
      }

      if (selectorMode === SelectorMode.youReceive) {
        if (mint.equals(inputMint)) {
          setInputMint(outputMint)
        }
        setOutputMint(mint)
      }
    },
    [selectorMode, refresh, inputMint, outputMint],
  )

  const tokenData = useMemo(() => {
    const tokens = {
      [SelectorMode.youPay]: validInputMints.map((mint) => {
        const pk = new PublicKey(mint)

        return {
          mint: pk,
          selected: pk ? inputMint.equals(pk) : false,
        }
      }),
      [SelectorMode.youReceive]: validOutputMints.map((mint) => {
        const pk = new PublicKey(mint)

        return {
          mint: pk,
          selected: pk ? outputMint.equals(pk) : false,
        }
      }),
    }

    return tokens[selectorMode]
  }, [selectorMode, validInputMints, inputMint, validOutputMints, outputMint])

  const onCurrencySelect = useCallback(
    (youPay: boolean) => () => {
      Keyboard.dismiss()
      tokenSelectorRef.current?.showTokens()
      setSelectorMode(youPay ? SelectorMode.youPay : SelectorMode.youReceive)
    },
    [],
  )

  const onTokenItemPressed = useCallback(
    (youPay: boolean) => () => {
      Keyboard.dismiss()
      setSelectorMode(youPay ? SelectorMode.youPay : SelectorMode.youReceive)
      hntKeyboardRef.current?.show({
        payer: currentAccount,
      })
    },
    [currentAccount],
  )

  const getOutputAmount = useCallback(
    async ({ balance }: { balance: BN }) => {
      setRouteNotFound(false)
      if (outputMintAcc && inputMintAcc) {
        const { address: input, decimals: inputDecimals } = inputMintAcc
        const { address: output, decimals: outputDecimals } = outputMintAcc

        if (!isDevnet && !output.equals(DC_MINT)) {
          const route = await getRoute({
            amount: balance.toNumber(),
            inputMint: input.toBase58(),
            outputMint: output.toBase58(),
            slippageBps,
          })
          if (!route) {
            setRouteNotFound(true)
          }
          setPriceImpact(Number(route?.priceImpactPct || '0') * 100)

          return setOutputAmount(
            toNumber(new BN(Number(route?.outAmount || 0)), outputDecimals),
          )
        }
        if (output.equals(DC_MINT)) {
          if (input.equals(HNT_MINT)) {
            return setOutputAmount(
              toNumber(
                networkTokensToDc(toBN(balance, inputDecimals)) || new BN(0),
                inputDecimals,
              ),
            )
          }
          setRouteNotFound(true)
          return setOutputAmount(0)
        }

        if (isDevnet) {
          if (price && !input.equals(HNT_MINT)) {
            return setOutputAmount(price)
          }

          return setOutputAmount(0)
        }

        return setOutputAmount(0)
      }
    },
    [
      getRoute,
      inputMintAcc,
      isDevnet,
      networkTokensToDc,
      outputMintAcc,
      price,
      slippageBps,
    ],
  )

  useEffect(() => {
    // if changing outputMint ensure we get new routes
    ;(async () => {
      if (
        !isDevnet &&
        inputMintAcc &&
        outputMintAcc &&
        typeof inputAmount !== 'undefined' &&
        inputAmount > 0 &&
        !outputMintAcc?.address.equals(DC_MINT)
      ) {
        setRecipient('')
        setRecipientOpen(false)
        await getOutputAmount({
          balance: toBN(inputAmount || 0, inputMintAcc.decimals),
        })
      }
    })()
  }, [
    getOutputAmount,
    inputAmount,
    inputMintAcc,
    outputMintAcc,
    isDevnet,
    setRecipient,
    setRecipientOpen,
  ])

  const getInputAmount = useCallback(
    async ({ balance }: { balance: BN }) => {
      if (outputMintAcc && inputMintAcc) {
        const { address: input, decimals: inputDecimals } = inputMintAcc
        const { address: output, decimals: outputDecimals } = outputMintAcc

        if (!isDevnet && !output.equals(DC_MINT)) {
          const route = await getRoute({
            amount: balance.toNumber(),
            inputMint: output.toBase58(),
            outputMint: input.toBase58(),
            slippageBps,
          })

          if (!route) {
            setRouteNotFound(true)
            return setInputAmount(0)
          }

          return setInputAmount(
            toNumber(new BN(Number(route?.outAmount || 0)), inputDecimals),
          )
        }
        if (output.equals(DC_MINT)) {
          if (input.equals(HNT_MINT)) {
            return setInputAmount(
              toNumber(
                dcToNetworkTokens(toBN(balance, outputDecimals)) || new BN(0),
                inputDecimals,
              ),
            )
          }
          setRouteNotFound(true)
        }
        if (isDevnet) {
          if (price && !input.equals(HNT_MINT)) {
            return setInputAmount(price)
          }

          return setInputAmount(0)
        }

        return setInputAmount(0)
      }
    },
    [
      dcToNetworkTokens,
      getRoute,
      inputMintAcc,
      isDevnet,
      outputMintAcc,
      price,
      slippageBps,
    ],
  )

  const onConfirmBalance = useCallback(
    async ({ balance }: { balance: BN }) => {
      if (inputMintAcc && outputMintAcc) {
        const { decimals: inputDecimals } = inputMintAcc
        const { decimals: outputDecimals } = outputMintAcc
        const isPay = selectorMode === SelectorMode.youPay
        const amount = toNumber(balance, isPay ? inputDecimals : outputDecimals)

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        isPay ? setInputAmount(amount) : setOutputAmount(amount)
        await (isPay
          ? getOutputAmount({ balance })
          : getInputAmount({ balance }))
      }
    },
    [
      selectorMode,
      inputMintAcc,
      outputMintAcc,
      getInputAmount,
      getOutputAmount,
    ],
  )

  const minReceived = useMemo(
    () => outputAmount - outputAmount * (slippageBps / 100 / 100),
    [slippageBps, outputAmount],
  )

  const handleSwapTokens = useCallback(async () => {
    if (connection && currentAccount?.solanaAddress && inputMint) {
      try {
        setSwapping(true)

        if (!currentAccount?.solanaAddress) throw new Error('No account found')

        if (recipient && !solAddressIsValid(recipient)) {
          setSwapping(false)
          setHasRecipientError(true)
          return
        }

        const recipientAddr = recipient
          ? new PublicKey(recipient)
          : new PublicKey(currentAccount.solanaAddress)

        if (
          inputMint.equals(HNT_MINT) &&
          outputMint.equals(DC_MINT) &&
          outputAmount
        ) {
          await submitMintDataCredits({
            dcAmount: new BN(outputAmount),
            recipient: recipientAddr,
          })
        } else if (isDevnet) {
          await submitTreasurySwap(inputMint, inputAmount, recipientAddr)
        } else {
          const swapTxn = await getSwapTx()

          if (!swapTxn) {
            throw new Error(t('errors.swap.tx'))
          }

          await submitJupiterSwap({
            inputMint,
            inputAmount,
            outputMint,
            outputAmount,
            minReceived,
            swapTxn,
          })
        }

        setSwapping(false)

        navigation.push('SwappingScreen', {
          tokenA: inputMint.toBase58(),
          tokenB: outputMint.toBase58(),
        })
      } catch (error) {
        setSwapping(false)
        setTransactionError((error as Error).message)
      }
    }
  }, [
    connection,
    currentAccount?.solanaAddress,
    recipient,
    inputMint,
    inputAmount,
    outputMint,
    outputAmount,
    minReceived,
    navigation,
    submitTreasurySwap,
    submitMintDataCredits,
    submitJupiterSwap,
    setHasRecipientError,
    isDevnet,
    t,
    getSwapTx,
  ])

  const isLoading = useMemo(() => {
    if (!isDevnet) return loading
    return loadingPrice
  }, [loading, loadingPrice, isDevnet])

  return (
    <ScrollBox
      backgroundColor={'primaryBackground'}
      style={{
        paddingTop: spacing['6xl'],
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaBox
          backgroundColor="primaryBackground"
          edges={edges}
          flex={1}
          paddingHorizontal={'5'}
          style={{
            marginBottom: slippageInfoVisible
              ? 0
              : NavBarHeight + bottom + spacing['2xl'],
          }}
        >
          <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={60}>
            {Header}
            <Box justifyContent="center" gap="md" marginVertical="4xl">
              <SwapItem
                onPress={onTokenItemPressed(true)}
                isPaying
                onCurrencySelect={onCurrencySelect(true)}
                mintSelected={inputMint}
                amount={inputAmount}
              />
              {Slippage}
              <Box>
                <SwapItem
                  onPress={onTokenItemPressed(false)}
                  isPaying={false}
                  onCurrencySelect={onCurrencySelect(false)}
                  mintSelected={outputMint}
                  amount={outputAmount}
                  loading={isLoading}
                />
                {!isRecipientOpen && outputMint.equals(DC_MINT) && (
                  <TouchableOpacityBox
                    marginBottom="4"
                    hitSlop={hitSlop}
                    alignItems="center"
                    onPress={handleRecipientClick}
                  >
                    <Box alignItems="center" flexDirection="row">
                      <Text
                        variant="textSmRegular"
                        marginLeft="3"
                        marginRight="xs"
                        color="secondaryText"
                      >
                        {t('swapsScreen.addRecipient')}
                      </Text>
                      <Plus color={colors.secondaryText} />
                    </Box>
                  </TouchableOpacityBox>
                )}
                {isRecipientOpen && (
                  <TextInput
                    floatingLabel={t('collectablesScreen.transferTo')}
                    optional
                    variant="thickDark"
                    backgroundColor="error.500"
                    marginHorizontal="4"
                    marginBottom="4"
                    height={80}
                    textColor="base.white"
                    fontSize={15}
                    TrailingIcon={Menu}
                    onTrailingIconPress={handleAddressBookSelected}
                    textInputProps={{
                      placeholder: t('generic.solanaAddress'),
                      placeholderTextColor: 'base.white',
                      autoCorrect: false,
                      autoComplete: 'off',
                      onChangeText: handleEditAddress,
                      value: recipient,
                    }}
                  />
                )}
                {showError && (
                  <Box marginTop="2">
                    <Text
                      marginTop="2"
                      marginHorizontal="4"
                      variant="textXsMedium"
                      color="error.500"
                      textAlign="center"
                    >
                      {showError}
                    </Text>
                  </Box>
                )}
                {priceImpact > 2.5 && (
                  <Box marginTop="2">
                    <Text
                      variant="textSmRegular"
                      color="orange.500"
                      textAlign="center"
                      marginTop="2"
                      marginBottom="4"
                      marginHorizontal="4"
                    >
                      {t('swapsScreen.priceImpact', {
                        percent: priceImpact.toFixed(2),
                      })}
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          </KeyboardAvoidingView>
          <Box flexDirection="column" marginBottom="8">
            <ButtonPressable
              height={65}
              flexGrow={1}
              borderRadius="full"
              backgroundColor="primaryText"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="bg.tertiary"
              backgroundColorDisabledOpacity={0.5}
              titleColorDisabled="secondaryText"
              titleColor={'primaryBackground'}
              disabled={
                hasInsufficientBalance ||
                insufficientTokensToSwap ||
                inputAmount === 0 ||
                loading ||
                swapping
              }
              titleColorPressedOpacity={0.3}
              title={swapping ? '' : t('swapsScreen.swapTokens')}
              onPress={handleSwapTokens}
              TrailingComponent={
                swapping ? (
                  <CircleLoader loaderSize={20} color="primaryText" />
                ) : undefined
              }
            />

            <Box marginTop="4">
              {!isDevnet && !outputMint.equals(DC_MINT) && (
                <TextTransform
                  textAlign="center"
                  marginHorizontal="4"
                  variant="textXsMedium"
                  color="primaryText"
                  i18nKey="swapsScreen.slippageLabelValue"
                  values={{ amount: slippageBps / 100 }}
                />
              )}
              <TextTransform
                textAlign="center"
                marginHorizontal="4"
                variant="textXsMedium"
                color="primaryText"
                i18nKey="collectablesScreen.transferFee"
                values={{ amount: humanReadable(solFee, 9) }}
              />
              {!isDevnet && !outputMint.equals(DC_MINT) && (
                <TextTransform
                  textAlign="center"
                  marginHorizontal="4"
                  variant="textXsMedium"
                  color="primaryText"
                  i18nKey="swapsScreen.minReceived"
                  values={{ amount: minReceived }}
                />
              )}
            </Box>
          </Box>
        </SafeAreaBox>
      </TouchableWithoutFeedback>
      {slippageInfoVisible ? (
        <ReAnimatedBlurBox
          visible
          entering={FadeInFast}
          position="absolute"
          height="100%"
          width="100%"
          marginBottom="6xl"
        >
          <Box flexDirection="column" height="100%">
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              marginTop="6"
            >
              <Box flex={1}>
                <CloseButton
                  marginStart="4"
                  onPress={() => setSlippageInfoVisible(false)}
                />
              </Box>
              <Box flex={1} alignItems="center" flexDirection="row">
                <Text
                  variant="textXlRegular"
                  color="primaryText"
                  flex={1}
                  textAlign="center"
                >
                  {t('swapsScreen.slippage')}
                </Text>
              </Box>
              <Box flex={1} />
            </Box>
            <Box flex={1} paddingHorizontal="4" marginTop="6">
              <Text
                variant="textMdMedium"
                color="primaryText"
                flex={1}
                textAlign="center"
              >
                {t('swapsScreen.slippageInfo')}
              </Text>
            </Box>
          </Box>
        </ReAnimatedBlurBox>
      ) : undefined}
      <HNTKeyboard
        ref={hntKeyboardRef}
        allowOverdraft={selectorMode === SelectorMode.youReceive}
        onConfirmBalance={onConfirmBalance}
        mint={selectorMode === SelectorMode.youPay ? inputMint : outputMint}
        networkFee={SOL_TXN_FEE}
        // Ensure that we keep at least 0.02 sol
        minTokens={
          inputMint.equals(NATIVE_MINT)
            ? new BN(MIN_BALANCE_THRESHOLD)
            : undefined
        }
      />
      <TokenSelector
        ref={tokenSelectorRef}
        onTokenSelected={setTokenTypeHandler}
        tokenData={tokenData}
      />
      <AddressBookSelector
        ref={addressBookRef}
        onContactSelected={handleContactSelected}
        hideCurrentAccount
      />
    </ScrollBox>
  )
}

export default memo(SwapScreen)
