import Menu from '@assets/images/menu.svg'
import Plus from '@assets/images/plus.svg'
import Refresh from '@assets/images/refresh.svg'
import AddressBookSelector, {
  AddressBookRef,
} from '@components/AddressBookSelector'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import CloseButton from '@components/CloseButton'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TextTransform from '@components/TextTransform'
import TokenSelector, { TokenSelectorRef } from '@components/TokenSelector'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import TreasuryWarningScreen from '@components/TreasuryWarningScreen'
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
} from '@helium/spl-utils'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useTreasuryPrice } from '@hooks/useTreasuryPrice'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { CSAccount } from '@storage/cloudStorage'
import { useColors, useHitSlop } from '@theme/themeHooks'
import {
  TXN_FEE_IN_LAMPORTS,
  TXN_FEE_IN_SOL,
  getAtaAccountCreationFee,
  humanReadable,
} from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { useSolana } from '../../solana/SolanaProvider'
import { useBalance } from '../../utils/Balance'
import { solAddressIsValid } from '../../utils/accountUtils'
import SwapItem from './SwapItem'
import { SwapNavigationProp } from './swapTypes'

const SOL_TXN_FEE = new BN(TXN_FEE_IN_SOL)

// Selector Mode enum
enum SelectorMode {
  youPay = 'youPay',
  youReceive = 'youReceive',
}

const SwapScreen = () => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, connection } = useSolana()
  const navigation = useNavigation<SwapNavigationProp>()
  const { submitTreasurySwap, submitMintDataCredits } = useSubmitTxn()
  const edges = useMemo(() => ['bottom'] as Edge[], [])
  const [selectorMode, setSelectorMode] = useState(SelectorMode.youPay)
  const [youPayMint, setYouPayMint] = useState<PublicKey>(MOBILE_MINT)
  const colors = useColors()
  const [youPayTokenAmount, setYouPayTokenAmount] = useState<number>(0)
  const [youReceiveMint, setYouReceiveMint] = useState<PublicKey>(HNT_MINT)
  const [solFee, setSolFee] = useState<BN | undefined>(undefined)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState<
    undefined | boolean
  >()
  const [networkError, setNetworkError] = useState<undefined | string>()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const hntBalance = useBN(useOwnedAmount(wallet, HNT_MINT).amount)
  const { networkTokensToDc } = useBalance()
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const {
    price,
    loading: loadingPrice,
    freezeDate,
  } = useTreasuryPrice(youPayMint, youPayTokenAmount)
  const [swapping, setSwapping] = useState(false)
  const [transactionError, setTransactionError] = useState<undefined | string>()
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
    setHasRecipientError(false)
  }, [])

  // If user does not have enough tokens to swap for greater than 0.00000001 tokens
  const insufficientTokensToSwap = useMemo(() => {
    if (
      youPayMint.equals(HNT_MINT) &&
      (hntBalance || new BN(0)).lt(new BN(1))
    ) {
      return true
    }

    return (
      !youPayMint.equals(HNT_MINT) &&
      !(price && price > 0) &&
      youPayTokenAmount > 0
    )
  }, [hntBalance, price, youPayTokenAmount, youPayMint])

  const showError = useMemo(() => {
    if (hasRecipientError) return t('generic.notValidSolanaAddress')
    if (insufficientTokensToSwap)
      return t('swapsScreen.insufficientTokensToSwap')
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
    if (transactionError) return transactionError
  }, [
    hasRecipientError,
    hasInsufficientBalance,
    insufficientTokensToSwap,
    networkError,
    t,
    transactionError,
  ])

  const treasuryFrozen = useMemo(() => {
    if (!freezeDate) return false
    return freezeDate.getTime() > Date.now()
  }, [freezeDate])

  const refresh = useCallback(async () => {
    setYouPayTokenAmount(0)
    setYouReceiveMint(HNT_MINT)
    setYouPayMint(MOBILE_MINT)
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

    let fee = new BN(TXN_FEE_IN_LAMPORTS)

    const ataFee = await getAtaAccountCreationFee({
      solanaAddress: currentAccount.solanaAddress,
      connection,
      mint: youReceiveMint,
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
    youReceiveMint,
    youPayMint,
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
    (mint: PublicKey) => {
      if (selectorMode === SelectorMode.youPay) {
        refresh()
        setYouPayMint(mint)
      }

      if (selectorMode === SelectorMode.youReceive) {
        setYouReceiveMint(mint)
      }

      if (
        selectorMode === SelectorMode.youPay &&
        !mint.equals(HNT_MINT) &&
        !youReceiveMint.equals(DC_MINT)
      ) {
        setYouReceiveMint(HNT_MINT)
        setYouPayTokenAmount(0)
      }

      if (selectorMode === SelectorMode.youPay && mint.equals(HNT_MINT)) {
        setYouReceiveMint(DC_MINT)
      }

      if (selectorMode === SelectorMode.youReceive && mint.equals(HNT_MINT)) {
        setYouPayMint(MOBILE_MINT)
      }

      if (selectorMode === SelectorMode.youReceive && mint.equals(DC_MINT)) {
        setYouPayMint(HNT_MINT)
      }
    },
    [refresh, selectorMode, youReceiveMint],
  )

  const tokenData = useMemo(() => {
    const tokens = {
      [SelectorMode.youPay]: [MOBILE_MINT, HNT_MINT, IOT_MINT].map((mint) => ({
        mint,
        selected: youPayMint.equals(mint),
      })),
      [SelectorMode.youReceive]: [MOBILE_MINT, HNT_MINT, IOT_MINT].map(
        (mint) => ({
          mint,
          selected: youReceiveMint.equals(mint),
        }),
      ),
    }

    return tokens[selectorMode]
  }, [selectorMode, youPayMint, youReceiveMint])

  const onCurrencySelect = useCallback(
    (youPay: boolean) => () => {
      tokenSelectorRef.current?.showTokens()
      setSelectorMode(youPay ? SelectorMode.youPay : SelectorMode.youReceive)
    },
    [],
  )

  const decimals = useMint(youPayMint)?.info?.decimals

  const onTokenItemPressed = useCallback(() => {
    if (typeof decimals !== undefined) {
      hntKeyboardRef.current?.show({
        payer: currentAccount,
      })
    }
  }, [currentAccount, decimals])

  const onConfirmBalance = useCallback(
    ({ balance }: { balance: BN }) => {
      if (typeof decimals === 'undefined') return

      const amount = toNumber(balance, decimals)
      setYouPayTokenAmount(amount)
    },
    [decimals],
  )
  const hitSlop = useHitSlop('l')

  const youReceiveTokenAmount = useMemo(() => {
    if (price && !youPayMint.equals(HNT_MINT)) {
      return price
    }

    if (
      youPayMint.equals(HNT_MINT) &&
      currentAccount &&
      typeof decimals !== 'undefined' &&
      typeof youPayTokenAmount !== 'undefined'
    ) {
      return toNumber(
        networkTokensToDc(toBN(youPayTokenAmount, decimals)) || new BN(0),
        decimals,
      )
    }

    return 0
  }, [
    currentAccount,
    networkTokensToDc,
    price,
    youPayTokenAmount,
    youPayMint,
    decimals,
  ])

  const handleSwapTokens = useCallback(async () => {
    if (connection) {
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

        if (youPayMint.equals(HNT_MINT) && youReceiveTokenAmount) {
          await submitMintDataCredits({
            dcAmount: new BN(youReceiveTokenAmount),
            recipient: recipientAddr,
          })
        }

        if (!youPayMint.equals(HNT_MINT)) {
          await submitTreasurySwap(youPayMint, youPayTokenAmount, recipientAddr)
        }

        setSwapping(false)

        navigation.push('SwappingScreen', {
          tokenA: youPayMint.toBase58(),
          tokenB: youReceiveMint.toBase58(),
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
    youPayMint,
    navigation,
    youReceiveMint,
    submitMintDataCredits,
    youReceiveTokenAmount,
    submitTreasurySwap,
    youPayTokenAmount,
    setHasRecipientError,
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
          mint={youPayMint}
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
                    mintSelected={youPayMint}
                    amount={youPayTokenAmount}
                  />
                  <Box>
                    <SwapItem
                      disabled
                      marginTop="xxl"
                      marginHorizontal="m"
                      isPaying={false}
                      onCurrencySelect={onCurrencySelect(false)}
                      mintSelected={youReceiveMint}
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
                      youPayTokenAmount === 0 ||
                      treasuryFrozen ||
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

                  {solFee ? (
                    <Box marginTop="m">
                      <TextTransform
                        textAlign="center"
                        marginHorizontal="m"
                        variant="body3Medium"
                        color="white"
                        i18nKey="collectablesScreen.transferFee"
                        values={{ amount: humanReadable(solFee, 9) }}
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
