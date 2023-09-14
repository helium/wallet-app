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
  MOBILE_MINT,
  toBN,
  toNumber,
} from '@helium/spl-utils'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useJupiter } from '@storage/JupiterProvider'
import { useModal } from '@storage/ModalsProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { CSAccount } from '@storage/cloudStorage'
import { useColors, useHitSlop } from '@theme/themeHooks'
import { useBalance } from '@utils/Balance'
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
import { LayoutAnimation } from 'react-native'
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
  const { showModal } = useModal()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, connection } = useSolana()
  const wallet = useCurrentWallet()
  const colors = useColors()
  const navigation = useNavigation<SwapNavigationProp>()
  const { submitJupiterSwap, submitMintDataCredits } = useSubmitTxn()
  const edges = useMemo(() => ['bottom'] as Edge[], [])
  const [selectorMode, setSelectorMode] = useState(SelectorMode.youPay)
  const [inputMint, setInputMint] = useState<PublicKey>(MOBILE_MINT)
  const [inputAmount, setInputAmount] = useState<number>(0)
  const [outputMint, setOutputMint] = useState<PublicKey>(HNT_MINT)
  const [slippageBps, setSlippageBps] = useState<number>(50)
  const [slippageInfoVisible, setSlippageInfoVisible] = useState(false)
  const [solFee, setSolFee] = useState<BN>(SOL_TXN_FEE)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState<
    undefined | boolean
  >()
  const [networkError, setNetworkError] = useState<undefined | string>()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const hntBalance = useBN(useOwnedAmount(wallet, HNT_MINT).amount)
  const { networkTokensToDc } = useBalance()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const addressBookRef = useRef<AddressBookRef>(null)
  const [swapping, setSwapping] = useState(false)
  const [transactionError, setTransactionError] = useState<undefined | string>()
  const [hasRecipientError, setHasRecipientError] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [isRecipientOpen, setRecipientOpen] = useState(false)
  const { visibleTokens } = useVisibleTokens()
  const {
    loading,
    error: jupiterError,
    routeMap,
    routes,
    getRoute,
  } = useJupiter()

  const inputMintDecimals = useMint(inputMint)?.info?.decimals
  const outputMintDecimals = useMint(outputMint)?.info?.decimals

  const validInputMints = useMemo(
    () => [...routeMap.keys()].filter((key) => visibleTokens.has(key)),
    [visibleTokens, routeMap],
  )

  const validOutputMints = useMemo(() => {
    const routeMints =
      routeMap
        .get(inputMint?.toBase58() || '')
        ?.filter(
          (key) =>
            visibleTokens.has(key) && !inputMint.equals(new PublicKey(key)),
        ) || []

    return inputMint.equals(HNT_MINT)
      ? [DC_MINT.toBase58(), ...routeMints]
      : routeMints
  }, [visibleTokens, routeMap, inputMint])

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

  // If user does not have enough tokens to swap for greater than 0.00000001 tokens
  const insufficientTokensToSwap = useMemo(() => {
    if (inputMint.equals(HNT_MINT) && (hntBalance || new BN(0)).lt(new BN(1))) {
      return true
    }

    return (
      !inputMint.equals(HNT_MINT) &&
      !(routes?.outAmount && new BN(routes?.outAmount || 0).gt(new BN(0))) &&
      inputAmount > 0
    )
  }, [hntBalance, inputAmount, inputMint, routes])

  const showError = useMemo(() => {
    if (hasRecipientError) return t('generic.notValidSolanaAddress')
    if (insufficientTokensToSwap)
      return t('swapsScreen.insufficientTokensToSwap')
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
    if (transactionError) return transactionError
    if (jupiterError) return jupiterError
  }, [
    hasRecipientError,
    hasInsufficientBalance,
    insufficientTokensToSwap,
    networkError,
    jupiterError,
    t,
    transactionError,
  ])

  const refresh = useCallback(async () => {
    setInputAmount(0)
    setInputMint(MOBILE_MINT)
    setOutputMint(HNT_MINT)
    setSolFee(SOL_TXN_FEE)
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
        !validOutputMints?.includes(outputMint?.toBase58() || '')
      ) {
        setOutputMint(new PublicKey(validOutputMints[0]))
      }
    }
  }, [inputMint, outputMint, validOutputMints])

  useEffect(() => {
    // if changing outputMint ensure we get new routes
    ;(async () => {
      if (
        typeof inputMintDecimals !== 'undefined' &&
        typeof inputAmount !== 'undefined' &&
        inputAmount > 0 &&
        !outputMint.equals(DC_MINT)
      ) {
        await getRoute({
          amount: toBN(inputAmount || 0, inputMintDecimals).toNumber(),
          inputMint: inputMint.toBase58(),
          outputMint: outputMint.toBase58(),
          slippageBps,
        })
      }
    })()
  }, [
    inputAmount,
    outputMint,
    inputMint,
    slippageBps,
    inputMintDecimals,
    getRoute,
  ])

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
    const bpsOptions: number[] = [50, 100, 150]
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
  }, [slippageBps, setSlippageBps, outputMint, setSlippageInfoVisible, t])

  const setTokenTypeHandler = useCallback(
    (mint: PublicKey) => {
      if (selectorMode === SelectorMode.youPay) {
        refresh()
        setInputMint(mint)
      }

      if (selectorMode === SelectorMode.youReceive) {
        setOutputMint(mint)
      }

      if (selectorMode === SelectorMode.youPay && mint.equals(HNT_MINT)) {
        setOutputMint(DC_MINT)
      }
    },
    [refresh, selectorMode],
  )

  const tokenData = useMemo(() => {
    const tokens = {
      [SelectorMode.youPay]: validInputMints.map((mint) => {
        const pk = new PublicKey(mint)

        return {
          mint: pk,
          selected: inputMint.equals(pk),
        }
      }),
      [SelectorMode.youReceive]: validOutputMints.map((mint) => {
        const pk = new PublicKey(mint)

        return {
          mint: pk,
          selected: outputMint.equals(pk),
        }
      }),
    }

    return tokens[selectorMode]
  }, [selectorMode, validInputMints, inputMint, validOutputMints, outputMint])

  const onCurrencySelect = useCallback(
    (youPay: boolean) => () => {
      tokenSelectorRef.current?.showTokens()
      setSelectorMode(youPay ? SelectorMode.youPay : SelectorMode.youReceive)
    },
    [],
  )

  const onTokenItemPressed = useCallback(() => {
    if (typeof inputMintDecimals !== undefined) {
      hntKeyboardRef.current?.show({
        payer: currentAccount,
      })
    }
  }, [currentAccount, inputMintDecimals])

  const onConfirmBalance = useCallback(
    async ({ balance }: { balance: BN }) => {
      if (typeof inputMintDecimals === 'undefined') return

      const amount = toNumber(balance, inputMintDecimals)
      setInputAmount(amount)

      if (!outputMint.equals(DC_MINT)) {
        await getRoute({
          amount: balance.toNumber(),
          inputMint: inputMint.toBase58(),
          outputMint: outputMint.toBase58(),
          slippageBps,
        })
      }
    },
    [inputMintDecimals, inputMint, outputMint, slippageBps, getRoute],
  )

  const hitSlop = useHitSlop('l')

  const outputAmount = useMemo(() => {
    if (
      currentAccount &&
      typeof inputMintDecimals !== 'undefined' &&
      typeof outputMintDecimals !== 'undefined' &&
      typeof inputAmount !== 'undefined' &&
      inputAmount > 0
    ) {
      if (inputMint.equals(HNT_MINT) && outputMint.equals(DC_MINT)) {
        return toNumber(
          networkTokensToDc(toBN(inputAmount, inputMintDecimals)) || new BN(0),
          inputMintDecimals,
        )
      }

      return toNumber(
        new BN(Number(routes?.outAmount || 0)),
        outputMintDecimals,
      )
    }

    return 0
  }, [
    currentAccount,
    networkTokensToDc,
    inputAmount,
    inputMint,
    outputMint,
    outputMintDecimals,
    inputMintDecimals,
    routes,
  ])

  const minReceived = useMemo(
    () => outputAmount - outputAmount * (slippageBps / 100 / 100),
    [slippageBps, outputAmount],
  )

  const handleSwapTokens = useCallback(async () => {
    if (connection) {
      if (!solBalance || solBalance?.lt(solFee)) {
        return showModal('InsufficientSolConversion')
      }

      try {
        setSwapping(true)

        if (!currentAccount || !currentAccount.solanaAddress)
          throw new Error('No account found')

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
        } else {
          await submitJupiterSwap()
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
    showModal,
    solFee,
    solBalance,
    connection,
    currentAccount,
    recipient,
    inputMint,
    outputMint,
    outputAmount,
    navigation,
    submitMintDataCredits,
    submitJupiterSwap,
    setHasRecipientError,
  ])

  return (
    <AddressBookSelector
      ref={addressBookRef}
      onContactSelected={handleContactSelected}
      hideCurrentAccount
    >
      <HNTKeyboard
        ref={hntKeyboardRef}
        onConfirmBalance={onConfirmBalance}
        mint={inputMint}
        networkFee={SOL_TXN_FEE}
        usePortal
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
                  mintSelected={inputMint}
                  amount={inputAmount}
                />
                {Slippage}
                <Box>
                  <SwapItem
                    disabled
                    marginHorizontal="m"
                    isPaying={false}
                    onCurrencySelect={onCurrencySelect(false)}
                    mintSelected={outputMint}
                    amount={outputAmount}
                    loading={loading}
                  />

                  {!isRecipientOpen && (
                    <TouchableOpacityBox
                      marginTop="l"
                      hitSlop={hitSlop}
                      alignItems="center"
                      onPress={handleRecipientClick}
                    >
                      <Box
                        alignItems="center"
                        marginTop="s"
                        flexDirection="row"
                        marginBottom="l"
                      >
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
                      marginTop="l"
                      floatingLabel={t('collectablesScreen.transferTo')}
                      optional
                      variant="thickDark"
                      backgroundColor="red500"
                      marginHorizontal="m"
                      marginBottom="s"
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
                </Box>
              </Box>
              <Box
                flexDirection="column"
                marginBottom="xl"
                marginTop="m"
                marginHorizontal="xl"
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
                      <CircleLoader loaderSize={20} color="white" />
                    ) : undefined
                  }
                />

                <Box marginTop="m">
                  {!outputMint.equals(DC_MINT) && (
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
                  {!outputMint.equals(DC_MINT) && (
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
          </ReAnimatedBox>
        </TokenSelector>
        {slippageInfoVisible ? (
          <ReAnimatedBlurBox
            visible
            entering={FadeInFast}
            position="absolute"
            height="100%"
            width="100%"
          >
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
                <Text variant="h4" color="white" flex={1} textAlign="center">
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
          </ReAnimatedBlurBox>
        ) : undefined}
      </HNTKeyboard>
    </AddressBookSelector>
  )
}

export default memo(SwapScreen)
