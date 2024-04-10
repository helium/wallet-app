import Menu from '@assets/images/menu.svg'
import Plus from '@assets/images/plus.svg'
import Refresh from '@assets/images/refresh.svg'
import AddressBookSelector, {
  AddressBookRef,
} from '@components/AddressBookSelector'
import { ReAnimatedBlurBox, ReAnimatedBox } from '@components/AnimatedBox'
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
import { useColors, useHitSlop } from '@theme/themeHooks'
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
} from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { solAddressIsValid } from '../../utils/accountUtils'
import SwapItem from './SwapItem'
import { SwapNavigationProp } from './swapTypes'

const SOL_TXN_FEE = new BN(TXN_FEE_IN_LAMPORTS)

// Selector Mode enum
enum SelectorMode {
  youPay = 'youPay',
  youReceive = 'youReceive',
}

const SwapScreen = () => {
  const { t } = useTranslation()
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
  const hitSlop = useHitSlop('l')

  const handleEditAddress = useCallback((text?: string) => {
    setRecipient(text || '')
    setHasRecipientError(false)
  }, [])

  const insufficientTokensToSwap = useMemo(() => {
    if (inputAmount > 0 && inputMintAcc) {
      return inputMintBalance?.lt(toBN(inputAmount || 0, inputMintAcc.decimals))
    }
  }, [inputAmount, inputMintBalance, inputMintAcc])

  const showError = useMemo(() => {
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
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="m"
      >
        <CloseButton onPress={handleClose} />
        <Text variant="h4" color="white" flex={1} textAlign="center">
          {t('swapsScreen.title')}
        </Text>
        <TouchableOpacityBox paddingEnd="m" onPress={refresh}>
          <Refresh width={16} height={16} />
        </TouchableOpacityBox>
      </Box>
    )
  }, [refresh, t, handleClose])

  const Slippage = useMemo(() => {
    if (isDevnet)
      return (
        <Box
          flexDirection="row"
          borderRadius="l"
          marginTop="xl"
          marginBottom="xxl"
          marginHorizontal="m"
          backgroundColor="surfaceSecondary"
        />
      )

    const bpsOptions: number[] = [30, 50, 100]
    const disabled = outputMint.equals(DC_MINT)

    return (
      <Box
        flexDirection="row"
        borderRadius="l"
        marginTop="xl"
        marginBottom="xxl"
        marginHorizontal="m"
        backgroundColor="surfaceSecondary"
        opacity={disabled ? 0.3 : 1}
      >
        <TouchableOpacityBox
          flex={1}
          borderEndWidth={2}
          alignItems="center"
          justifyContent="center"
          alignContent="center"
          flexDirection="row"
          paddingHorizontal="ms"
          onPress={() => setSlippageInfoVisible(true)}
        >
          <Text variant="body3Medium" color="surfaceSecondaryText">
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
              padding="ms"
              alignItems="center"
              borderEndWidth={isLast ? 0 : 2}
              borderTopRightRadius={isLast ? 'l' : 'none'}
              borderBottomRightRadius={isLast ? 'l' : 'none'}
              backgroundColor={
                !disabled && isActive ? 'black500' : 'surfaceSecondary'
              }
              onPress={() => setSlippageBps(bps)}
            >
              <Text
                variant="body3Medium"
                color={isActive ? 'primaryText' : 'surfaceSecondaryText'}
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
    if (connection && currentAccount?.solanaAddress) {
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
          await submitJupiterSwap(swapTxn)
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
    <ReAnimatedBox flex={1}>
      <AddressBookSelector
        ref={addressBookRef}
        onContactSelected={handleContactSelected}
        hideCurrentAccount
      >
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
          usePortal
        >
          <TokenSelector
            ref={tokenSelectorRef}
            onTokenSelected={setTokenTypeHandler}
            tokenData={tokenData}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <SafeAreaBox backgroundColor="black900" edges={edges} flex={1}>
                <KeyboardAvoidingView
                  behavior="position"
                  keyboardVerticalOffset={60}
                >
                  {Header}
                  <Box flexGrow={1} justifyContent="center" marginTop="xxxl">
                    <SwapItem
                      onPress={onTokenItemPressed(true)}
                      marginHorizontal="m"
                      isPaying
                      onCurrencySelect={onCurrencySelect(true)}
                      mintSelected={inputMint}
                      amount={inputAmount}
                    />
                    {Slippage}
                    <Box>
                      <SwapItem
                        onPress={onTokenItemPressed(false)}
                        marginHorizontal="m"
                        marginBottom="m"
                        isPaying={false}
                        onCurrencySelect={onCurrencySelect(false)}
                        mintSelected={outputMint}
                        amount={outputAmount}
                        loading={isLoading}
                      />
                      {!isRecipientOpen && outputMint.equals(DC_MINT) && (
                        <TouchableOpacityBox
                          marginBottom="m"
                          hitSlop={hitSlop}
                          alignItems="center"
                          onPress={handleRecipientClick}
                        >
                          <Box alignItems="center" flexDirection="row">
                            <Text
                              marginLeft="ms"
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
                          backgroundColor="red500"
                          marginHorizontal="m"
                          marginBottom="m"
                          height={80}
                          textColor="white"
                          fontSize={15}
                          TrailingIcon={Menu}
                          onTrailingIconPress={handleAddressBookSelected}
                          textInputProps={{
                            placeholder: t('generic.solanaAddress'),
                            placeholderTextColor: 'white',
                            autoCorrect: false,
                            autoComplete: 'off',
                            onChangeText: handleEditAddress,
                            value: recipient,
                          }}
                        />
                      )}
                      {showError && (
                        <Box marginTop="s">
                          <Text
                            marginTop="s"
                            marginHorizontal="m"
                            variant="body3Medium"
                            color="red500"
                            textAlign="center"
                          >
                            {showError}
                          </Text>
                        </Box>
                      )}
                      {priceImpact > 2.5 && (
                        <Box marginTop="s">
                          <Text
                            color="orange500"
                            textAlign="center"
                            marginTop="s"
                            marginBottom="m"
                            marginHorizontal="m"
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
                <Box
                  flexDirection="column"
                  marginBottom="xl"
                  marginHorizontal="m"
                >
                  <ButtonPressable
                    height={65}
                    flexGrow={1}
                    borderRadius="round"
                    backgroundColor="white"
                    backgroundColorOpacityPressed={0.7}
                    backgroundColorDisabled="surfaceSecondary"
                    backgroundColorDisabledOpacity={0.5}
                    titleColorDisabled="secondaryText"
                    titleColor="black"
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
                        <CircleLoader loaderSize={20} color="black" />
                      ) : undefined
                    }
                  />

                  <Box marginTop="m">
                    {!isDevnet && !outputMint.equals(DC_MINT) && (
                      <TextTransform
                        textAlign="center"
                        marginHorizontal="m"
                        variant="body3Medium"
                        color="white"
                        i18nKey="swapsScreen.slippageLabelValue"
                        values={{ amount: slippageBps / 100 }}
                      />
                    )}
                    <TextTransform
                      textAlign="center"
                      marginHorizontal="m"
                      variant="body3Medium"
                      color="white"
                      i18nKey="collectablesScreen.transferFee"
                      values={{ amount: humanReadable(solFee, 9) }}
                    />
                    {!isDevnet && !outputMint.equals(DC_MINT) && (
                      <TextTransform
                        textAlign="center"
                        marginHorizontal="m"
                        variant="body3Medium"
                        color="white"
                        i18nKey="swapsScreen.minReceived"
                        values={{ amount: minReceived }}
                      />
                    )}
                  </Box>
                </Box>
              </SafeAreaBox>
            </TouchableWithoutFeedback>
          </TokenSelector>
          {slippageInfoVisible ? (
            <ReAnimatedBlurBox
              visible
              entering={FadeInFast}
              position="absolute"
              height="100%"
              width="100%"
            >
              <Box flexDirection="column" height="100%">
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  marginTop="l"
                >
                  <Box flex={1}>
                    <CloseButton
                      marginStart="m"
                      onPress={() => setSlippageInfoVisible(false)}
                    />
                  </Box>
                  <Box flex={1} alignItems="center" flexDirection="row">
                    <Text
                      variant="h4"
                      color="white"
                      flex={1}
                      textAlign="center"
                    >
                      {t('swapsScreen.slippage')}
                    </Text>
                  </Box>
                  <Box flex={1} />
                </Box>
                <Box flex={1} paddingHorizontal="m" marginTop="l">
                  <Text
                    variant="body1Medium"
                    color="white"
                    flex={1}
                    textAlign="center"
                  >
                    {t('swapsScreen.slippageInfo')}
                  </Text>
                </Box>
              </Box>
            </ReAnimatedBlurBox>
          ) : undefined}
        </HNTKeyboard>
      </AddressBookSelector>
    </ReAnimatedBox>
  )
}

export default memo(SwapScreen)
