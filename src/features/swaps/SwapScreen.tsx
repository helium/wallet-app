import Menu from '@assets/images/menu.svg'
import Refresh from '@assets/images/refresh.svg'
import TokenDC from '@assets/images/tokenDC.svg'
import TokenHNT from '@assets/images/tokenHNT.svg'
import TokenIOT from '@assets/images/tokenIOT.svg'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import Plus from '@assets/images/plus.svg'
import AddressBookSelector, {
  AddressBookRef,
} from '@components/AddressBookSelector'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CloseButton from '@components/CloseButton'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TextTransform from '@components/TextTransform'
import TokenSelector, { TokenSelectorRef } from '@components/TokenSelector'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import TreasuryWarningScreen from '@components/TreasuryWarningScreen'
import Balance, { CurrencyType, SolTokens, Ticker } from '@helium/currency'
import useAlert from '@hooks/useAlert'
import { useTreasuryPrice } from '@hooks/useTreasuryPrice'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { CSAccount } from '@storage/cloudStorage'
import { Mints } from '@utils/constants'
import { getAtaAccountCreationFee, TXN_FEE_IN_SOL } from '@utils/solanaUtils'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  LayoutAnimation,
  NativeSyntheticEvent,
  TextInputEndEditingEventData,
} from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useColors, useHitSlop } from '@theme/themeHooks'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { solAddressIsValid } from '../../utils/accountUtils'
import { useBalance } from '../../utils/Balance'
import SwapItem from './SwapItem'
import { SwapNavigationProp } from './swapTypes'
import { useSolana } from '../../solana/SolanaProvider'

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
  DC = 'DC',
}

const SwapScreen = () => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, connection } = useSolana()
  const navigation = useNavigation<SwapNavigationProp>()
  const { submitTreasurySwap, submitMintDataCredits } = useSubmitTxn()
  const edges = useMemo(() => ['bottom'] as Edge[], [])
  const [selectorMode, setSelectorMode] = useState(SelectorMode.youPay)
  const [youPayTokenType, setYouPayTokenType] = useState<Ticker>(Tokens.MOBILE)
  const colors = useColors()
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
  const { networkTokensToDc, hntBalance, solBalance } = useBalance()
  const { showOKCancelAlert } = useAlert()
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const {
    price,
    loading: loadingPrice,
    freezeDate,
  } = useTreasuryPrice(new PublicKey(Mints[youPayTokenType]), youPayTokenAmount)

  const [hasRecipientError, setHasRecipientError] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [isRecipientOpen, setRecipientOpen] = useState(false)
  const handleRecipientClick = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setRecipientOpen(!isRecipientOpen)
  }, [isRecipientOpen, setRecipientOpen])
  const addressBookRef = useRef<AddressBookRef>(null)
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
  }, [])

  const handleAddressBlur = useCallback(
    (event?: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
      const text = event?.nativeEvent.text
      setHasRecipientError(!solAddressIsValid(text || ''))
    },
    [],
  )

  // If user does not have enough tokens to swap for greater than 0.00000001 tokens
  const insufficientTokensToSwap = useMemo(() => {
    if (
      youPayTokenType === Tokens.HNT &&
      (hntBalance?.floatBalance || 0) < 0.00000001
    ) {
      return true
    }

    return (
      youPayTokenType !== Tokens.HNT &&
      !(price && price > 0) &&
      youPayTokenAmount > 0
    )
  }, [hntBalance, price, youPayTokenAmount, youPayTokenType])

  const showError = useMemo(() => {
    if (hasRecipientError) return t('generic.notValidSolanaAddress')
    if (insufficientTokensToSwap)
      return t('swapsScreen.insufficientTokensToSwap')
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
  }, [
    hasRecipientError,
    hasInsufficientBalance,
    insufficientTokensToSwap,
    networkError,
    t,
  ])

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

    const toMint = new PublicKey(Mints[youReceiveTokenType])
    let fee = TXN_FEE_IN_SOL

    const ataFee = await getAtaAccountCreationFee({
      solanaAddress: currentAccount.solanaAddress,
      connection,
      mint: toMint,
    })
    fee += ataFee.floatBalance

    setSolFee(fee)

    setHasInsufficientBalance(
      fee > solBalance.integerBalance || solBalance.floatBalance < 0.000005,
    )
  }, [
    anchorProvider,
    currentAccount?.solanaAddress,
    solBalance,
    youReceiveTokenType,
    youPayTokenType,
  ])

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
      }

      if (selectorMode === SelectorMode.youReceive) {
        setYouReceiveTokenType(ticker)
      }

      if (
        selectorMode === SelectorMode.youPay &&
        ticker !== Tokens.HNT &&
        youReceiveTokenType === Tokens.DC
      ) {
        setYouReceiveTokenType(Tokens.HNT)
        setYouPayTokenAmount(0)
      }

      if (selectorMode === SelectorMode.youPay && ticker === Tokens.HNT) {
        setYouReceiveTokenType(Tokens.DC)
      }

      if (selectorMode === SelectorMode.youReceive && ticker === Tokens.HNT) {
        setYouPayTokenType(Tokens.MOBILE)
      }

      if (selectorMode === SelectorMode.youReceive && ticker === Tokens.DC) {
        setYouPayTokenType(Tokens.HNT)
      }
    },
    [refresh, selectorMode, youReceiveTokenType],
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
          label: Tokens.HNT,
          icon: <TokenHNT color="white" width={30} height={30} />,
          value: Tokens.HNT,
          selected: youPayTokenType === Tokens.HNT,
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
          icon: <TokenHNT color="white" width={30} height={30} />,
          value: Tokens.HNT,
          selected: youReceiveTokenType === Tokens.HNT,
        },
        {
          label: Tokens.DC,
          icon: <TokenDC width={30} height={30} />,
          value: Tokens.DC,
          selected: youReceiveTokenType === Tokens.DC,
        },
      ],
    }

    return tokens[selectorMode]
  }, [selectorMode, youPayTokenType, youReceiveTokenType])

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
  const hitSlop = useHitSlop('l')

  const youReceiveTokenAmount = useMemo(() => {
    if (price && youPayTokenType !== Tokens.HNT) {
      return price
    }

    if (youPayTokenType === Tokens.HNT && currentAccount) {
      const networkTokens = Balance.fromFloat(
        Number(youPayTokenAmount),
        CurrencyType.networkToken,
      )
      const rawBalance = networkTokensToDc(networkTokens)?.floatBalance
      if (typeof rawBalance !== 'undefined') {
        return Math.floor(rawBalance)
      }
    }

    return 0
  }, [
    currentAccount,
    networkTokensToDc,
    price,
    youPayTokenAmount,
    youPayTokenType,
  ])

  const handleSwapTokens = useCallback(async () => {
    const decision = await showOKCancelAlert({
      title: t('swapsScreen.swapAlertTitle'),
      message: t('swapsScreen.swapAlertBody'),
    })
    if (!currentAccount || !currentAccount.solanaAddress)
      throw new Error('No account found')

    const recipientAddr =
      recipient && !hasRecipientError
        ? new PublicKey(recipient)
        : new PublicKey(currentAccount.solanaAddress)
    if (!decision) return

    if (youPayTokenType === Tokens.HNT) {
      submitMintDataCredits({
        dcAmount: youReceiveTokenAmount,
        recipient: recipientAddr,
      })
    }

    if (youPayTokenType !== Tokens.HNT) {
      submitTreasurySwap(
        new PublicKey(Mints[youPayTokenType]),
        youPayTokenAmount,
        recipientAddr,
      )
    }

    navigation.push('SwappingScreen', {
      tokenA: youPayTokenType,
      tokenB: youReceiveTokenType,
    })
  }, [
    showOKCancelAlert,
    t,
    currentAccount,
    recipient,
    hasRecipientError,
    youPayTokenType,
    navigation,
    youReceiveTokenType,
    submitMintDataCredits,
    youReceiveTokenAmount,
    submitTreasurySwap,
    youPayTokenAmount,
  ])

  return (
    <AddressBookSelector
      ref={addressBookRef}
      onContactSelected={handleContactSelected}
      hideCurrentAccount
    >
      <TreasuryWarningScreen>
        <HNTKeyboard
          ref={hntKeyboardRef}
          onConfirmBalance={onConfirmBalance}
          ticker={youPayTokenType}
          networkFee={Balance.fromFloatAndTicker(
            solFee || TXN_FEE_IN_SOL,
            Tokens.SOL,
          )}
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
                          onEndEditing: handleAddressBlur,
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
                    backgroundColorOpacity={1}
                    backgroundColorOpacityPressed={0.05}
                    titleColorDisabled="grey600"
                    backgroundColorDisabled="white"
                    backgroundColorDisabledOpacity={0.1}
                    disabled={
                      hasInsufficientBalance ||
                      insufficientTokensToSwap ||
                      youPayTokenAmount === 0 ||
                      treasuryFrozen
                    }
                    titleColorPressedOpacity={0.3}
                    title={t('swapsScreen.swapTokens')}
                    titleColor="black"
                    onPress={handleSwapTokens}
                  />

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
                      color="secondaryText"
                    >
                      {t('generic.calculatingTransactionFee')}
                    </Text>
                  )}
                </Box>
              </SafeAreaBox>
            </ReAnimatedBox>
          </TokenSelector>
        </HNTKeyboard>
      </TreasuryWarningScreen>
    </AddressBookSelector>
  )
}

export default memo(SwapScreen)
