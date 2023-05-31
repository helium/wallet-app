import React, {
  useCallback,
  memo as reactMemo,
  useMemo,
  useEffect,
  useState,
  useRef,
} from 'react'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/close.svg'
import QR from '@assets/images/qr.svg'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context'
import Balance, { CurrencyType, Ticker } from '@helium/currency'
import Address, { NetTypes } from '@helium/address'
import { TokenBurnV1 } from '@helium/transactions'
import { useSelector } from 'react-redux'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors, useHitSlop } from '@theme/themeHooks'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import AccountButton from '@components/AccountButton'
import SubmitButton from '@components/SubmitButton'
import LedgerBurnModal, {
  LedgerBurnModalRef,
} from '@components/LedgerBurnModal'
import useAlert from '@hooks/useAlert'
import TokenSelector, {
  TokenListItem,
  TokenSelectorRef,
} from '@components/TokenSelector'
import TokenButton from '@components/TokenButton'
import TokenIOT from '@assets/images/tokenIOT.svg'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import { Mints } from '@utils/constants'
import { PublicKey } from '@solana/web3.js'
import SafeAreaBox from '@components/SafeAreaBox'
import { TXN_FEE_IN_SOL } from '../../utils/solanaUtils'
import { RootState } from '../../store/rootReducer'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import {
  accountNetType,
  ellipsizeAddress,
  formatAccountAlias,
  solAddressIsValid,
} from '../../utils/accountUtils'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { balanceToString, useBalance } from '../../utils/Balance'
import PaymentSummary from '../payment/PaymentSummary'
import PaymentSubmit from '../payment/PaymentSubmit'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import IconPressedContainer from '../../components/IconPressedContainer'
import PaymentItem from '../payment/PaymentItem'
import AddressBookSelector, {
  AddressBookRef,
} from '../../components/AddressBookSelector'
import { CSAccount } from '../../storage/cloudStorage'
import useSubmitTxn from '../../hooks/useSubmitTxn'

type Route = RouteProp<HomeStackParamList, 'BurnScreen'>
const BurnScreen = () => {
  const route = useRoute<Route>()
  const {
    accounts,
    currentAccount,
    sortedAccountsForNetType,
    setCurrentAccount,
    defaultAccountAddress,
  } = useAccountStorage()
  const { top } = useSafeAreaInsets()
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { primaryText, blueBright500 } = useColors()
  const ledgerPaymentRef = useRef<LedgerBurnModalRef>(null)
  const hitSlop = useHitSlop('l')
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const { submitDelegateDataCredits } = useSubmitTxn()
  const addressBookRef = useRef<AddressBookRef>(null)
  const {
    floatToBalance,
    networkTokensToDc,
    hntBalance,
    solBalance,
    dcBalance,
  } = useBalance()
  const { showOKAlert } = useAlert()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const [dcAmount, setDcAmount] = useState(
    new Balance(Number(route.params.amount), CurrencyType.dataCredit),
  )
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const [delegateAddress, setDelegateAddress] = useState(route.params.address)
  const [hasError, setHasError] = useState(false)
  const delegatePayment = useSelector(
    (reduxState: RootState) => reduxState.solana.delegate,
  )
  const [ticker, setTicker] = useState<Ticker>('MOBILE')
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)

  const mint = useMemo(() => new PublicKey(Mints[ticker]), [ticker])

  const { isDelegate } = useMemo(() => route.params, [route.params])

  const containerStyle = useMemo(
    () => ({ marginTop: Platform.OS === 'android' ? top : undefined }),
    [top],
  )

  const networkType = useMemo(
    () => accountNetType(route.params.address),
    [route.params.address],
  )

  const handleShowAccounts = useCallback(() => {
    if (!accountSelectorRef?.current) return
    accountSelectorRef.current.showAccountTypes(networkType)()
  }, [networkType])

  const amountBalance = useMemo(() => {
    const amount = parseFloat(route.params.amount)

    if (dcAmount) return dcAmount

    return floatToBalance(amount, 'HNT')
  }, [floatToBalance, dcAmount, route.params.amount])

  const feeAsTokens = useMemo(() => {
    return Balance.fromFloat(TXN_FEE_IN_SOL, CurrencyType.solTokens)
  }, [])

  const amountInDc = useMemo(() => {
    if (!amountBalance) return
    return networkTokensToDc(amountBalance)
  }, [amountBalance, networkTokensToDc])

  const onTokenItemPressed = useCallback(() => {
    hntKeyboardRef.current?.show({
      payer: currentAccount,
      balance: amountBalance,
    })
  }, [amountBalance, currentAccount])

  useEffect(() => {
    if (currentAccount?.netType === networkType || isDelegate) return

    const accts = sortedAccountsForNetType(networkType)

    if (!accts.length) {
      // Show error, they don't have any accounts for this net type
      showOKAlert({
        title: t('burn.noAcct.title'),
        message: t('burn.noAcct.message'),
      }).then(navigation.goBack)
      return
    }

    let acct = accts[0]

    const defaultAccount = accounts?.[defaultAccountAddress || '']
    if (defaultAccount?.netType === NetTypes.MAINNET) {
      acct = defaultAccount
    }
    setCurrentAccount(acct)
  }, [
    accounts,
    currentAccount,
    defaultAccountAddress,
    isDelegate,
    navigation.goBack,
    networkType,
    setCurrentAccount,
    showOKAlert,
    sortedAccountsForNetType,
    t,
  ])

  const handleSubmit = useCallback(async () => {
    try {
      if (isDelegate && amountBalance) {
        await submitDelegateDataCredits(
          delegateAddress,
          amountBalance.integerBalance,
          mint,
        )
      }
    } catch (e) {
      setSubmitError((e as Error)?.message)
    }
  }, [
    amountBalance,
    delegateAddress,
    isDelegate,
    mint,
    submitDelegateDataCredits,
    setSubmitError,
  ])

  const handleQrScan = useCallback(() => {
    navigation.navigate('PaymentQrScanner')
  }, [navigation])

  const ledgerPaymentConfirmed = useCallback(
    (_opts: { txn: TokenBurnV1; txnJson: string }) => {
      console.error('Ledger payment not supported')
    },
    [],
  )

  const handleLedgerError = useCallback(
    async (error: Error) => {
      await showOKAlert({
        title: t('generic.error'),
        message: error.toString(),
      })
      navigation.goBack()
    },
    [navigation, showOKAlert, t],
  )

  const insufficientFunds = useMemo(() => {
    if (!amountBalance || !feeAsTokens || !dcBalance || !solBalance)
      return false

    if (amountBalance.floatBalance > dcBalance.floatBalance) {
      return true
    }

    if (feeAsTokens.floatBalance > solBalance.floatBalance) {
      return true
    }

    return hntBalance && hntBalance.floatBalance < feeAsTokens.floatBalance
  }, [amountBalance, dcBalance, feeAsTokens, hntBalance, solBalance])

  const errors = useMemo(() => {
    const errStrings: string[] = []
    if (insufficientFunds) {
      errStrings.push(
        t('payment.insufficientFunds', { token: amountBalance?.type.ticker }),
      )
    }

    return errStrings
  }, [amountBalance, insufficientFunds, t])

  const onConfirmBalance = useCallback((opts) => {
    setDcAmount(new Balance(opts.balance.floatBalance, CurrencyType.dataCredit))
  }, [])

  const handleAddressBookSelected = useCallback(
    ({ address, index }: { address?: string | undefined; index: number }) => {
      addressBookRef?.current?.showAddressBook({ address, index })
    },
    [],
  )

  const handleContactSelected = useCallback(
    ({
      contact,
      index,
    }: {
      contact: CSAccount
      prevAddress?: string
      index?: number
    }) => {
      if (index === undefined) return

      const payee = contact.solanaAddress

      if (!payee) return

      setDelegateAddress(payee)
    },
    [],
  )

  const handleAddressError = useCallback(
    ({ address }: { address: string }) => {
      let invalidAddress = false

      if (isDelegate) {
        invalidAddress = !!address && !Address.isValid(address)
      } else {
        invalidAddress = !!address && !solAddressIsValid(address)
      }

      const wrongNetType =
        address !== undefined &&
        address !== '' &&
        accountNetType(address) !== networkType

      setHasError(invalidAddress || wrongNetType)
    },
    [networkType, isDelegate],
  )

  const onTickerSelected = useCallback((tick: Ticker) => {
    setTicker(tick)
  }, [])

  const handleTokenTypeSelected = useCallback(() => {
    tokenSelectorRef?.current?.showTokens()
  }, [])

  const data = useMemo(
    (): TokenListItem[] => [
      {
        label: 'MOBILE',
        icon: <TokenMOBILE width={30} height={30} color={blueBright500} />,
        value: 'MOBILE' as Ticker,
        selected: ticker === 'MOBILE',
      },
      {
        label: 'IOT',
        icon: <TokenIOT width={30} height={30} />,
        value: 'IOT' as Ticker,
        selected: ticker === 'IOT',
      },
    ],
    [blueBright500, ticker],
  )

  if (!amountBalance) return null

  return (
    <HNTKeyboard
      ref={hntKeyboardRef}
      onConfirmBalance={onConfirmBalance}
      ticker={amountBalance?.type.ticker}
      networkFee={Balance.fromFloatAndTicker(TXN_FEE_IN_SOL, 'SOL')}
      usePortal
    >
      <TokenSelector
        ref={tokenSelectorRef}
        onTokenSelected={onTickerSelected}
        tokenData={data}
      >
        <AccountSelector ref={accountSelectorRef}>
          <AddressBookSelector
            ref={addressBookRef}
            onContactSelected={handleContactSelected}
            hideCurrentAccount
          >
            <LedgerBurnModal
              ref={ledgerPaymentRef}
              onConfirm={ledgerPaymentConfirmed}
              onError={handleLedgerError}
              title={t('burn.ledger.title')}
              subtitle={t('burn.ledger.subtitle', {
                name: currentAccount?.ledgerDevice?.name,
              })}
            >
              <SafeAreaBox
                backgroundColor="secondaryBackground"
                flex={1}
                style={containerStyle}
                edges={['top'] as Edge[]}
              >
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box hitSlop={hitSlop} padding="s">
                    <IconPressedContainer
                      onPress={handleQrScan}
                      activeOpacity={0.75}
                      idleOpacity={1.0}
                    >
                      <QR color={primaryText} height={16} width={16} />
                    </IconPressedContainer>
                  </Box>
                  <Text
                    variant="subtitle2"
                    flex={1}
                    textAlign="center"
                    color="primaryText"
                    maxFontSizeMultiplier={1}
                  >
                    {t(isDelegate ? 'delegate.title' : 'burn.title')}
                  </Text>
                  <TouchableOpacityBox
                    onPress={navigation.goBack}
                    width={64}
                    padding="l"
                    hitSlop={hitSlop}
                  >
                    <Close color={primaryText} height={16} width={16} />
                  </TouchableOpacityBox>
                </Box>

                <KeyboardAwareScrollView
                  enableOnAndroid
                  enableResetScrollToCoords={false}
                  keyboardShouldPersistTaps="always"
                >
                  <AccountButton
                    backgroundColor="secondary"
                    accountIconSize={41}
                    paddingTop="l"
                    title={formatAccountAlias(currentAccount)}
                    subtitle={t('payment.senderAccount')}
                    showChevron={
                      sortedAccountsForNetType(networkType).length > 1
                    }
                    address={currentAccount?.address}
                    onPress={handleShowAccounts}
                    showBubbleArrow
                    marginHorizontal="l"
                    marginBottom="xs"
                  />

                  <TokenButton
                    backgroundColor="secondary"
                    title={t('burn.subdao', { subdao: ticker })}
                    subtitle={t('burn.choooseSubDAO')}
                    address={currentAccount?.address}
                    onPress={handleTokenTypeSelected}
                    showBubbleArrow
                    marginHorizontal="l"
                    ticker={ticker}
                  />

                  {isDelegate ? (
                    <PaymentItem
                      index={0}
                      onAddressBookSelected={handleAddressBookSelected}
                      onEditAmount={onTokenItemPressed}
                      onEditAddress={({ address }) => {
                        setDelegateAddress(address)
                        handleAddressError({
                          address,
                        })
                      }}
                      handleAddressError={handleAddressError}
                      ticker={amountBalance?.type.ticker}
                      address={delegateAddress}
                      amount={amountBalance}
                      hasError={hasError}
                      hideMemo
                    />
                  ) : (
                    <>
                      <AccountButton
                        backgroundColor="surfaceSecondary"
                        accountIconSize={41}
                        subtitle={t('burn.recipient')}
                        title={ellipsizeAddress(
                          route.params.address || delegateAddress,
                        )}
                        showBubbleArrow
                        showChevron={false}
                        address={route.params.address}
                        marginHorizontal="l"
                      />
                      <Box
                        marginTop="xs"
                        marginHorizontal="l"
                        backgroundColor="secondary"
                        borderRadius="xl"
                        paddingHorizontal="m"
                        overflow="hidden"
                      >
                        <Text
                          variant="body3"
                          color="secondaryText"
                          marginTop="m"
                        >
                          {t('burn.amount')}
                        </Text>
                        <Text variant="subtitle2" color="primaryText">
                          {amountBalance.toString()}
                        </Text>
                        <Text
                          variant="body3"
                          marginBottom="m"
                          color="secondaryText"
                        >
                          {t('payment.fee', {
                            value: balanceToString(feeAsTokens, {
                              maxDecimalPlaces: 4,
                            }),
                          })}
                        </Text>

                        <Box
                          height={1}
                          backgroundColor="primaryBackground"
                          marginHorizontal="n_m"
                        />

                        <Text
                          variant="body3"
                          color="secondaryText"
                          marginTop="m"
                        >
                          {t('burn.equivalent')}
                        </Text>
                        <Text
                          variant="subtitle2"
                          color="primaryText"
                          marginBottom="m"
                        >
                          {amountInDc?.toString()}
                        </Text>

                        <Box
                          height={1}
                          backgroundColor="primaryBackground"
                          marginHorizontal="n_m"
                        />
                      </Box>
                    </>
                  )}
                </KeyboardAwareScrollView>
                {submitError && (
                  <Box marginBottom="s">
                    <Text
                      marginTop="s"
                      marginHorizontal="m"
                      variant="body3Medium"
                      color="red500"
                      textAlign="center"
                    >
                      {submitError}
                    </Text>
                  </Box>
                )}
                <Box
                  borderTopLeftRadius="xl"
                  borderTopRightRadius="xl"
                  padding="l"
                  overflow="hidden"
                  minHeight={220}
                  backgroundColor="secondary"
                >
                  <PaymentSummary
                    totalBalance={amountBalance}
                    feeTokenBalance={feeAsTokens}
                    errors={errors}
                  />
                  <Box flex={1} justifyContent="flex-end">
                    <SubmitButton
                      disabled={
                        amountBalance.floatBalance === 0 ||
                        hasError ||
                        (!delegateAddress && isDelegate)
                      }
                      marginTop="l"
                      title={t(
                        isDelegate ? 'delegate.swipe' : 'burn.swipeToBurn',
                      )}
                      onSubmit={handleSubmit}
                    />
                  </Box>
                </Box>
              </SafeAreaBox>
              <PaymentSubmit
                submitLoading={!!delegatePayment?.loading}
                submitSucceeded={delegatePayment?.success}
                submitError={delegatePayment?.error}
                totalBalance={amountBalance}
                feeTokenBalance={feeAsTokens}
                onRetry={handleSubmit}
                onSuccess={navigation.popToTop}
                actionTitle={t('generic.ok')}
              />
            </LedgerBurnModal>
          </AddressBookSelector>
        </AccountSelector>
      </TokenSelector>
    </HNTKeyboard>
  )
}

export default reactMemo(BurnScreen)
