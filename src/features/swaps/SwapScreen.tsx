import AddressBookSelector, {
  AddressBookRef,
} from '@components/AddressBookSelector'
import CloseButton from '@components/CloseButton'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import TextTransform from '@components/TextTransform'
import TokenSelector, { TokenSelectorRef } from '@components/TokenSelector'
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
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { useBalance } from '@utils/Balance'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import { TXN_FEE_IN_LAMPORTS, humanReadable } from '@utils/solanaUtils'
import { useQuery } from '@tanstack/react-query'
import BN from 'bn.js'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, Plus, RefreshCw } from 'lucide-react-native'
import {
  LayoutAnimation,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useSolana } from '../../solana/SolanaProvider'
import { solAddressIsValid } from '../../utils/accountUtils'
import SwapItem from './SwapItem'
import { ataCreationFeeQuery } from './logic/ataCreationFeeQuery'
import { swapRoute } from './logic/swapRoute'
import { SwapNavigationProp } from './swapTypes'
import { FADE_IN } from '@theme/motion'

const SOL_TXN_FEE = new BN(TXN_FEE_IN_LAMPORTS)

const SafeArea = withUniwind(SafeAreaView)
const MenuIcon = withUniwind(Menu)
const PlusIcon = withUniwind(Plus)
const RefreshIcon = withUniwind(RefreshCw)

// Selector Mode enum
enum SelectorMode {
  youPay = 'youPay',
  youReceive = 'youReceive',
}

const SwapScreen = () => {
  // Opt out: compiler does not support throw inside try/catch, see handleSwapTokens
  'use no memo'

  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const { isDevnet, connection } = useSolana()
  const wallet = useCurrentWallet()
  const navigation = useNavigation<SwapNavigationProp>()
  const { submitJupiterSwap, submitTreasurySwap, submitMintDataCredits } =
    useSubmitTxn()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const [selectorMode, setSelectorMode] = useState(SelectorMode.youPay)
  const [inputMint, setInputMint] = useState<PublicKey>(MOBILE_MINT)
  const [inputAmount, setInputAmount] = useState<number>(0)
  const [outputMint, setOutputMint] = useState<PublicKey>(HNT_MINT)
  const [outputAmount, setOutputAmount] = useState<number>(0)
  const [priceImpact, setPriceImpact] = useState<number>(0)
  const [slippageBps, setSlippageBps] = useState<number>(50)
  const [slippageInfoVisible, setSlippageInfoVisible] = useState(false)
  const [routeNotFound, setRouteNotFound] = useState(false)
  const [networkError, setNetworkError] = useState<undefined | string>()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const inputMintBalance = useBN(useOwnedAmount(wallet, inputMint).amount)
  const {
    networkTokensToDc,
    dcToNetworkTokens,
    oraclePrice,
    oraclePriceError,
  } = useBalance()
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

  const { data: ataFee } = useQuery(
    ataCreationFeeQuery({
      connection,
      solanaAddress: currentAccount?.solanaAddress,
      mint: outputMint,
      solBalance,
    }),
  )
  const solFee = useMemo(
    () => (ataFee ? SOL_TXN_FEE.add(ataFee) : SOL_TXN_FEE),
    [ataFee],
  )
  // Unknown until the fee for this output mint and the balance have loaded
  const hasInsufficientBalance = useMemo(() => {
    if (!ataFee || !solBalance) return undefined
    return solFee.gt(solBalance) || solBalance.lt(SOL_TXN_FEE)
  }, [ataFee, solBalance, solFee])

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
  const handleEditAddress = useCallback((text?: string) => {
    setRecipient(text || '')
    setHasRecipientError(false)
  }, [])

  const insufficientTokensToSwap = useMemo(() => {
    if (inputAmount > 0 && inputMintAcc) {
      return inputMintBalance?.lt(toBN(inputAmount || 0, inputMintAcc.decimals))
    }
  }, [inputAmount, inputMintBalance, inputMintAcc])

  const swapRouteType = useMemo(
    () => swapRoute({ inputMint, outputMint, isDevnet }),
    [inputMint, outputMint, isDevnet],
  )
  const isHntToDc = swapRouteType === 'mintDc'
  const hntToDcPriceMissing = isHntToDc && (!oraclePrice || !outputAmount)
  const hntPriceLoading = isHntToDc && !oraclePrice && !oraclePriceError
  const hntPriceUnavailable = useMemo(
    () =>
      oraclePriceError
        ? t('errors.swap.hntPriceError', { message: oraclePriceError.message })
        : t('errors.swap.hntPrice'),
    [oraclePriceError, t],
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showError: any = useMemo(() => {
    if (hasRecipientError) return t('generic.notValidSolanaAddress')
    if (insufficientTokensToSwap)
      return t('swapsScreen.insufficientTokensToSwap')
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
    if (jupiterError) return jupiterError
    if (transactionError) return transactionError
    if (routeNotFound) return t('swapsScreen.routeNotFound')
    if (isHntToDc && !oraclePrice && oraclePriceError)
      return hntPriceUnavailable
  }, [
    isHntToDc,
    oraclePrice,
    oraclePriceError,
    hntPriceUnavailable,
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
    setRecipient('')
    setRecipientOpen(false)
    setSelectorMode(SelectorMode.youPay)
    setNetworkError(undefined)
  }, [])

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the token prices once when the screen opens
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const Header = useMemo(() => {
    return (
      <View className="flex-row items-center justify-center px-4">
        <CloseButton onPress={handleClose} />
        <Text size="xl" className="flex-1 text-center font-medium">
          {t('swapsScreen.title')}
        </Text>
        <PressableScale
          feedback="opacity"
          className="pe-4"
          onPress={() => void refresh().catch(console.error)}
        >
          <RefreshIcon size={16} colorClassName="accent-foreground" />
        </PressableScale>
      </View>
    )
  }, [refresh, t, handleClose])

  const Slippage = useMemo(() => {
    if (isDevnet)
      return (
        <View className="mx-4 mb-12 mt-8 flex-row rounded-[12px] bg-secondary" />
      )

    const bpsOptions: number[] = [30, 50, 100]
    const disabled = outputMint.equals(DC_MINT)

    return (
      <View
        className={`mx-4 mb-12 mt-8 flex-row overflow-hidden rounded-[12px] bg-secondary ${
          disabled ? 'opacity-30' : ''
        }`}
      >
        <PressableScale
          feedback="opacity"
          className="flex-1 flex-row items-center justify-center border-e-2 border-background px-3"
          onPress={() => setSlippageInfoVisible(true)}
        >
          <Text size="xs" className="font-medium text-muted-foreground">
            {t('swapsScreen.slippage')}
          </Text>
        </PressableScale>

        {bpsOptions.map((bps, idx) => {
          const isLast = idx === bpsOptions.length - 1
          const isActive = slippageBps === bps

          return (
            <PressableScale
              disabled={disabled}
              key={bps}
              feedback="opacity"
              className={`flex-1 items-center border-background p-3 ${
                isLast ? '' : 'border-e-2'
              } ${!disabled && isActive ? 'bg-primary' : 'bg-secondary'}`}
              onPress={() => setSlippageBps(bps)}
            >
              <Text
                size="xs"
                className={`font-medium ${
                  !disabled && isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {bps / 100}%
              </Text>
            </PressableScale>
          )
        })}
      </View>
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
        void refresh()

        if (mint.equals(outputMint)) {
          setOutputMint(inputMint)
        }
        setInputMint(mint)
      }

      if (selectorMode === SelectorMode.youReceive) {
        setRecipient('')
        setRecipientOpen(false)

        if (mint.equals(inputMint)) {
          setInputMint(outputMint)
        }
        setOutputMint(mint)
      }
    },
    [
      selectorMode,
      inputMint,
      outputMint,
      refresh,
      setRecipient,
      setRecipientOpen,
    ],
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
      if (!outputMintAcc || !inputMintAcc) return

      const { address: input, decimals: inputDecimals } = inputMintAcc
      const { address: output, decimals: outputDecimals } = outputMintAcc
      const handleDevnetPrice = () => {
        if (price && !input.equals(HNT_MINT)) {
          return setOutputAmount(price)
        }
        return setOutputAmount(0)
      }

      const handleJupiterRoute = async () => {
        const route = await getRoute({
          amount: balance.toNumber(),
          inputMint: input.toBase58(),
          outputMint: output.toBase58(),
          slippageBps,
        })

        if (!route) {
          setRouteNotFound(true)
          setPriceImpact(0)
          return setOutputAmount(0)
        }

        setPriceImpact(Number(route?.priceImpactPct || '0') * 100)
        return setOutputAmount(
          toNumber(new BN(Number(route?.outAmount || 0)), outputDecimals),
        )
      }

      const handleDCConversion = () => {
        if (!input.equals(HNT_MINT)) {
          setRouteNotFound(true)
          return setOutputAmount(0)
        }

        return setOutputAmount(
          toNumber(
            networkTokensToDc(toBN(balance, inputDecimals)) || new BN(0),
            inputDecimals,
          ),
        )
      }

      if (output.equals(DC_MINT)) return handleDCConversion()
      if (isDevnet) return handleDevnetPrice()
      return handleJupiterRoute()
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
    if (
      !inputMintAcc?.address?.equals(inputMint) ||
      !outputMintAcc?.address?.equals(outputMint) ||
      typeof inputAmount === 'undefined' ||
      inputAmount <= 0
    ) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- recomputes the quote when the swap inputs change; the Jupiter route is async and the devnet/DC paths share the same setters
    void getOutputAmount({
      balance: toBN(inputAmount, inputMintAcc.decimals),
    })
  }, [
    getOutputAmount,
    inputMint,
    inputAmount,
    inputMintAcc,
    outputMint,
    outputMintAcc,
  ])

  const getInputAmount = useCallback(
    async ({ balance }: { balance: BN }) => {
      setRouteNotFound(false)
      if (!outputMintAcc || !inputMintAcc) return

      const { address: input, decimals: inputDecimals } = inputMintAcc
      const { address: output, decimals: outputDecimals } = outputMintAcc

      const handleDevnetPrice = () => {
        if (price && !input.equals(HNT_MINT)) {
          return setInputAmount(price)
        }
        return setInputAmount(0)
      }

      const handleJupiterRoute = async () => {
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

      const handleDCConversion = () => {
        if (input.equals(HNT_MINT)) {
          return setInputAmount(
            toNumber(
              dcToNetworkTokens(toBN(balance, outputDecimals)) || new BN(0),
              inputDecimals,
            ),
          )
        }

        setRouteNotFound(true)
        return setInputAmount(0)
      }

      if (output.equals(DC_MINT)) return handleDCConversion()
      if (isDevnet) return handleDevnetPrice()
      return handleJupiterRoute()
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

        let batchId: string | undefined
        if (swapRouteType === 'mintDc') {
          const hntAmount = hntToDcPriceMissing
            ? undefined
            : dcToNetworkTokens(new BN(outputAmount))
          if (!hntAmount) throw new Error(hntPriceUnavailable)

          batchId = await submitMintDataCredits({
            hntAmount,
            dcAmount: new BN(outputAmount),
            recipient: recipientAddr,
          })
        } else if (swapRouteType === 'treasury') {
          batchId = await submitTreasurySwap(
            inputMint,
            inputAmount,
            recipientAddr,
          )
        } else {
          const swapTxn = await getSwapTx()

          if (!swapTxn) {
            throw new Error(t('errors.swap.tx'))
          }

          batchId = await submitJupiterSwap({
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
          batchId,
        })
      } catch (error) {
        setSwapping(false)
        setTransactionError((error as Error).message)
      }
    }
  }, [
    connection,
    currentAccount,
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
    swapRouteType,
    hntToDcPriceMissing,
    t,
    getSwapTx,
    dcToNetworkTokens,
    hntPriceUnavailable,
  ])

  const isLoading = useMemo(() => {
    if (!isDevnet) return loading
    return loadingPrice
  }, [loading, loadingPrice, isDevnet])

  return (
    <View className="flex-1">
      <AddressBookSelector
        ref={addressBookRef}
        onContactSelected={handleContactSelected}
        hideCurrentAccount
      >
        <HNTKeyboard
          ref={hntKeyboardRef}
          allowOverdraft={selectorMode === SelectorMode.youReceive}
          onConfirmBalance={(confirmation) =>
            void onConfirmBalance(confirmation).catch(console.error)
          }
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
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessibilityRole="button"
            >
              <SafeArea edges={edges} className="flex-1 bg-background">
                <KeyboardAvoidingView
                  behavior="position"
                  keyboardVerticalOffset={60}
                >
                  {Header}
                  <View className="mt-15 grow justify-center">
                    <SwapItem
                      testID="Swap.PayItem"
                      onPress={onTokenItemPressed(true)}
                      className="mx-4"
                      isPaying
                      onCurrencySelect={onCurrencySelect(true)}
                      mintSelected={inputMint}
                      amount={inputAmount}
                    />
                    {Slippage}
                    <View>
                      <SwapItem
                        onPress={onTokenItemPressed(false)}
                        className="mx-4 mb-4"
                        isPaying={false}
                        onCurrencySelect={onCurrencySelect(false)}
                        mintSelected={outputMint}
                        amount={outputAmount}
                        loading={isLoading}
                      />
                      {!isRecipientOpen && outputMint.equals(DC_MINT) && (
                        <PressableScale
                          feedback="opacity"
                          hitSlop={24}
                          className="mb-4 items-center"
                          onPress={handleRecipientClick}
                        >
                          <View className="flex-row items-center">
                            <Text className="me-1 ms-3 text-muted-foreground">
                              {t('swapsScreen.addRecipient')}
                            </Text>
                            <PlusIcon
                              size={16}
                              colorClassName="accent-muted-foreground"
                            />
                          </View>
                        </PressableScale>
                      )}
                      {isRecipientOpen && (
                        <View className="mx-4 mb-4">
                          <Text
                            size="xs"
                            className="mb-1 text-muted-foreground"
                          >
                            {t('collectablesScreen.transferTo')}
                          </Text>
                          <View className="flex-row items-center">
                            <Input
                              variant="form"
                              className="flex-1"
                              placeholder={t('generic.solanaAddress')}
                              autoCorrect={false}
                              autoComplete="off"
                              onChangeText={handleEditAddress}
                              value={recipient}
                            />
                            <PressableScale
                              feedback="opacity"
                              hitSlop={12}
                              className="ms-3"
                              onPress={handleAddressBookSelected}
                            >
                              <MenuIcon
                                size={24}
                                colorClassName="accent-foreground"
                              />
                            </PressableScale>
                          </View>
                        </View>
                      )}
                      {showError && (
                        <View className="mt-2">
                          <Text
                            size="xs"
                            className="mx-4 mt-2 text-center font-medium text-destructive"
                          >
                            {showError}
                          </Text>
                        </View>
                      )}
                      {!showError && hntPriceLoading && (
                        <View className="mt-2">
                          <Text
                            size="xs"
                            className="mx-4 mt-2 text-center font-medium text-muted-foreground"
                          >
                            {t('swapsScreen.hntPriceLoading')}
                          </Text>
                        </View>
                      )}
                      {priceImpact > 2.5 && (
                        <View className="mt-2">
                          <Text className="mx-4 mb-4 mt-2 text-center text-warning-500">
                            {t('swapsScreen.priceImpact', {
                              percent: priceImpact.toFixed(2),
                            })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </KeyboardAvoidingView>
                <View className="mx-4 mb-8">
                  <Button
                    variant="cta"
                    size="lg"
                    className="w-full"
                    disabled={
                      hasInsufficientBalance ||
                      insufficientTokensToSwap ||
                      inputAmount === 0 ||
                      routeNotFound ||
                      hntToDcPriceMissing ||
                      loading ||
                      swapping
                    }
                    onPress={() => void handleSwapTokens().catch(console.error)}
                    testID="Swap.Submit"
                  >
                    {swapping ? (
                      <Spinner colorClassName="accent-white" />
                    ) : (
                      t('swapsScreen.swapTokens')
                    )}
                  </Button>

                  <View className="mt-4">
                    {!isDevnet && !outputMint.equals(DC_MINT) && (
                      <TextTransform
                        textAlign="center"
                        marginHorizontal="m"
                        variant="body3Medium"
                        color="primaryText"
                        i18nKey="swapsScreen.slippageLabelValue"
                        values={{ amount: slippageBps / 100 }}
                      />
                    )}
                    <TextTransform
                      textAlign="center"
                      marginHorizontal="m"
                      variant="body3Medium"
                      color="primaryText"
                      i18nKey="collectablesScreen.transferFee"
                      values={{ amount: humanReadable(solFee, 9) }}
                    />
                    {!isDevnet && !outputMint.equals(DC_MINT) && (
                      <TextTransform
                        textAlign="center"
                        marginHorizontal="m"
                        variant="body3Medium"
                        color="primaryText"
                        i18nKey="swapsScreen.minReceived"
                        values={{ amount: minReceived }}
                      />
                    )}
                  </View>
                </View>
              </SafeArea>
            </TouchableWithoutFeedback>
          </TokenSelector>
          {slippageInfoVisible ? (
            <Animated.View
              entering={FADE_IN}
              className="absolute inset-0 bg-background"
            >
              <View className="mt-6 flex-row items-center justify-between">
                <View className="flex-1">
                  <CloseButton
                    marginStart="m"
                    onPress={() => setSlippageInfoVisible(false)}
                  />
                </View>
                <Text size="xl" className="flex-1 text-center">
                  {t('swapsScreen.slippage')}
                </Text>
                <View className="flex-1" />
              </View>
              <View className="mt-6 flex-1 px-4">
                <Text size="base" className="text-center font-medium">
                  {t('swapsScreen.slippageInfo')}
                </Text>
              </View>
            </Animated.View>
          ) : undefined}
        </HNTKeyboard>
      </AddressBookSelector>
    </View>
  )
}

export default memo(SwapScreen)
