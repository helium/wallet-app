/* eslint-disable no-param-reassign */
import React, {
  useCallback,
  useState,
  memo as reactMemo,
  useMemo,
  useEffect,
  useRef,
} from 'react'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/close.svg'
import QR from '@assets/images/qr.svg'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Balance, {
  CurrencyType,
  NetworkTokens,
  TestNetworkTokens,
  Ticker,
} from '@helium/currency'
import { Keyboard, Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Address, { NetTypes } from '@helium/address'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PaymentV2 } from '@helium/transactions'
import { unionBy } from 'lodash'
import Toast from 'react-native-simple-toast'
import { useSelector } from 'react-redux'
import TokenButton from '@components/TokenButton'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors, useHitSlop } from '@theme/themeHooks'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import TokenSelector, {
  TokenListItem,
  TokenSelectorRef,
} from '@components/TokenSelector'
import AccountButton from '@components/AccountButton'
import AddressBookSelector, {
  AddressBookRef,
} from '@components/AddressBookSelector'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import useDisappear from '@hooks/useDisappear'
import IconPressedContainer from '@components/IconPressedContainer'
import TokenSOL from '@assets/images/tokenSOL.svg'
import TokenIOT from '@assets/images/tokenIOT.svg'
import TokenHNT from '@assets/images/tokenHNT.svg'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import { calcCreateAssociatedTokenAccountAccountFee } from '@utils/solanaUtils'
import { Mints } from '@utils/constants'
import { PublicKey } from '@solana/web3.js'
import { fetchDomainOwner } from '@utils/getDomainOwner'
import { useSolana } from '../../solana/SolanaProvider'
import {
  HomeNavigationProp,
  HomeStackParamList,
  PaymentRouteParam,
} from '../home/homeTypes'
import {
  accountNetType,
  formatAccountAlias,
  solAddressIsValid,
} from '../../utils/accountUtils'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { balanceToString, useBalance } from '../../utils/Balance'
import PaymentItem from './PaymentItem'
import usePaymentsReducer, { MAX_PAYMENTS } from './usePaymentsReducer'
import PaymentCard from './PaymentCard'
import PaymentSubmit from './PaymentSubmit'
import { CSAccount } from '../../storage/cloudStorage'
import { RootState } from '../../store/rootReducer'
import { useAppDispatch } from '../../store/store'
import { solanaSlice } from '../../store/slices/solanaSlice'
import { RootNavigationProp } from '../../navigation/rootTypes'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { SendDetails } from '../../utils/linking'

type LinkedPayment = {
  amount?: string
  payee: string
  defaultTokenType?: Ticker
}

const parseLinkedPayments = (opts: PaymentRouteParam): LinkedPayment[] => {
  if (opts.payments) {
    return JSON.parse(opts.payments)
  }
  if (opts.payee) {
    return [
      {
        payee: opts.payee,
        amount: opts.amount,
        defaultTokenType: opts.defaultTokenType?.toUpperCase() as Ticker,
      },
    ]
  }
  return []
}

type Route = RouteProp<HomeStackParamList, 'PaymentScreen'>
const PaymentScreen = () => {
  const route = useRoute<Route>()
  const addressBookRef = useRef<AddressBookRef>(null)
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const { oraclePrice, hntBalance, solBalance, iotBalance, mobileBalance } =
    useBalance()
  const { anchorProvider, connection } = useSolana()

  const appDispatch = useAppDispatch()
  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { t } = useTranslation()
  const { primaryText, blueBright500, white } = useColors()
  const hitSlop = useHitSlop('l')
  const {
    currentAccount,
    currentNetworkAddress,
    accounts,
    contacts,
    setCurrentAccount,
    sortedAccountsForNetType,
  } = useAccountStorage()
  const [ticker, setTicker] = useState<Ticker>(
    (route.params?.defaultTokenType?.toUpperCase() as Ticker) || 'HNT',
  )
  const [mint, setMint] = useState<string>(
    (route.params?.defaultTokenType?.toUpperCase() as Ticker)
      ? Mints[route.params?.defaultTokenType?.toUpperCase() as Ticker]
      : Mints.HNT,
  )

  useDisappear(() => {
    appDispatch(solanaSlice.actions.resetPayment())
  })

  const navBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else if (rootNav.canGoBack()) {
      rootNav.goBack()
    } else {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'TabBarNavigator' }],
      })
    }
  }, [navigation, rootNav])

  const networkType = useMemo(() => {
    if (!route.params || !route.params.payer) {
      return accountNetType(currentAccount?.address)
    }

    const linkedPayments = parseLinkedPayments(route.params)
    if (!linkedPayments?.length) return accountNetType()

    return accountNetType(linkedPayments[0].payee)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  const currencyType = useMemo(() => CurrencyType.fromTicker(ticker), [ticker])

  const [paymentState, dispatch] = usePaymentsReducer({
    currencyType,
    oraclePrice,
    accountMobileBalance: mobileBalance,
    accountIotBalance: iotBalance,
    accountNetworkBalance: hntBalance,
    netType: networkType,
  })

  const { submitPayment, submitLedger } = useSubmitTxn()

  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )

  const { top } = useSafeAreaInsets()

  useEffect(() => {
    if (!route.params) return

    // Deep link handling
    const {
      params: { payer },
    } = route
    const payerAccount = accounts?.[payer || '']
    if (payerAccount) {
      setCurrentAccount(payerAccount)
    } else {
      // Deep link didnt specify a payer
      const acctsForNetType = sortedAccountsForNetType(networkType)
      if (!acctsForNetType.length) {
        // They don't have an account that can handle a payment for this network type
        Toast.show(t('payment.netTypeQrError'))
        navBack()
        return
      }
      if (!currentAccount || currentAccount.netType !== networkType) {
        // If an account of the same netType isn't already selected, set selected account to the first for the net type
        const [firstAcct] = acctsForNetType
        setCurrentAccount(firstAcct)
      }
    }

    const paymentsArr = parseLinkedPayments(route.params)

    if (!paymentsArr?.length) return

    if (paymentsArr[0].defaultTokenType) {
      onTickerSelected(paymentsArr[0].defaultTokenType)
    }

    if (
      paymentsArr.find((p) => {
        return !solAddressIsValid(p.payee)
      })
    ) {
      console.error('Invalid address found in deep link')
      return
    }

    dispatch({
      type: 'addLinkedPayments',
      payments: paymentsArr.map((p) => {
        const contact = contacts.find(
          ({ address, solanaAddress }) =>
            address === p.payee || solanaAddress === p.payee,
        )
        return {
          address: p.payee,
          account: contact,
          amount: p.amount,
        }
      }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  const handleBalance = useCallback(
    (opts: {
      balance: Balance<NetworkTokens | TestNetworkTokens>
      payee?: string
      index?: number
    }) => {
      if (opts.index === undefined || !currentAccount) return

      dispatch({
        type: 'updateBalance',
        value: opts.balance,
        address: opts.payee,
        index: opts.index,
        payer: currentAccount.address,
      })
    },
    [currentAccount, dispatch],
  )

  const handleQrScan = useCallback(() => {
    navigation.navigate('PaymentQrScanner')
  }, [navigation])

  const canAddPayee = useMemo(() => {
    if (currentAccount?.ledgerDevice) {
      // Only single payee is supported for ledger devices
      return false
    }
    const lastPayee = paymentState.payments[paymentState.payments.length - 1]

    return (
      paymentState.payments.length < MAX_PAYMENTS &&
      !!lastPayee.address &&
      !!lastPayee.amount &&
      lastPayee.amount.integerBalance > 0
    )
  }, [currentAccount, paymentState.payments])

  const payments = useMemo(
    (): Array<SendDetails> =>
      paymentState.payments.flatMap((p) => {
        if (!p.address || !p.amount) return []
        return [
          {
            payee: p.address,
            balanceAmount: p.amount,
            max: p.max,
          },
        ]
      }),
    [paymentState.payments],
  )

  const handleSubmit = useCallback(
    async (opts?: { txn: PaymentV2; txnJson: string }) => {
      try {
        if (!opts) {
          await submitPayment(payments)
        } else {
          // This is a ledger device
          submitLedger()
        }
      } catch (e) {
        console.error(e)
      }
    },
    [payments, submitPayment, submitLedger],
  )

  const insufficientFunds = useMemo((): [
    value: boolean,
    errorTicker: string,
  ] => {
    if (!hntBalance || !paymentState.totalAmount) {
      return [true, '']
    }
    if (paymentState.networkFee?.integerBalance === undefined)
      return [false, '']
    try {
      let hasEnoughSol = false
      if (solBalance) {
        hasEnoughSol =
          solBalance.minus(paymentState.networkFee).integerBalance >= 0
      }
      let hasEnoughToken = false
      if (ticker === 'MOBILE' && mobileBalance) {
        hasEnoughToken =
          mobileBalance.minus(paymentState.totalAmount).integerBalance >= 0
      } else if (ticker === 'IOT' && iotBalance) {
        hasEnoughToken =
          iotBalance.minus(paymentState.totalAmount).integerBalance >= 0
      } else if (ticker === 'HNT' && hntBalance) {
        hasEnoughToken =
          hntBalance.minus(paymentState.totalAmount).integerBalance >= 0
      } else if (ticker === 'SOL' && solBalance) {
        hasEnoughToken =
          solBalance.minus(paymentState.totalAmount).integerBalance >= 0
      }

      if (!hasEnoughSol) return [true, 'SOL' as Ticker]
      if (!hasEnoughToken) return [true, paymentState.totalAmount.type.ticker]
      return [false, '']
    } catch (e) {
      // if the screen was already open, then a deep link of a different net type
      // is selected there will be a brief arithmetic error that can be ignored.
      if (__DEV__) {
        console.warn(e)
      }
      return [false, '']
    }
  }, [
    hntBalance,
    paymentState.totalAmount,
    paymentState.networkFee,
    solBalance,
    ticker,
    mobileBalance,
    iotBalance,
  ])

  const selfPay = useMemo(
    () =>
      paymentState.payments.find((p) => p.address === currentNetworkAddress),
    [currentNetworkAddress, paymentState.payments],
  )

  const wrongNetTypePay = useMemo(
    () =>
      paymentState.payments.find((p) => {
        if (!p.address || !Address.isValid(p.address)) return false
        return accountNetType(p.address) !== currentAccount?.netType
      }),
    [currentAccount, paymentState.payments],
  )

  const errors = useMemo(() => {
    const errStrings: string[] = []

    if (!!currentAccount?.ledgerDevice && paymentState.payments.length > 1) {
      // ledger payments are limited to one payee
      errStrings.push(t('payment.ledgerTooManyRecipients'))
    }
    if (insufficientFunds[0]) {
      errStrings.push(
        t('payment.insufficientFunds', { token: insufficientFunds[1] }),
      )
    }

    if (selfPay) {
      errStrings.push(t('payment.selfPay'))
    }

    if (wrongNetTypePay) {
      errStrings.push(t('payment.wrongNetType'))
    }
    return errStrings
  }, [
    currentAccount,
    insufficientFunds,
    selfPay,
    paymentState.payments.length,
    t,
    wrongNetTypePay,
  ])

  const isFormValid = useMemo(() => {
    if (
      selfPay ||
      !paymentState.networkFee?.integerBalance ||
      (!!currentAccount?.ledgerDevice && paymentState.payments.length > 1) // ledger payments are limited to one payee
    ) {
      return false
    }

    const paymentsValid =
      paymentState.payments.length &&
      paymentState.payments.every((p) => {
        const addressValid = !!(p.address && solAddressIsValid(p.address))

        const paymentValid = p.amount && p.amount.integerBalance > 0
        return addressValid && paymentValid && !p.hasError
      })

    return paymentsValid && !insufficientFunds[0]
  }, [selfPay, paymentState, currentAccount, insufficientFunds])

  const handleTokenTypeSelected = useCallback(() => {
    tokenSelectorRef?.current?.showTokens()
  }, [])

  const onTickerSelected = useCallback(
    (tick: Ticker) => {
      setTicker(tick)
      setMint(Mints[tick])

      dispatch({
        type: 'changeToken',
        currencyType: CurrencyType.fromTicker(tick),
      })
    },
    [dispatch],
  )

  const handleAddressBookSelected = useCallback(
    ({ address, index }: { address?: string | undefined; index: number }) => {
      addressBookRef?.current?.showAddressBook({ address, index })
    },
    [],
  )

  const handleEditAmount = useCallback(
    ({ address, index }: { address?: string; index: number }) => {
      Keyboard.dismiss()
      hntKeyboardRef.current?.show({
        payer: currentAccount,
        payee: address,
        balance: paymentState.payments[index].amount,
        index,
        payments: paymentState.payments,
      })
    },
    [currentAccount, paymentState.payments],
  )

  const handleToggleMax = useCallback(
    ({ index }: { index: number }) => {
      dispatch({ type: 'toggleMax', index })
    },
    [dispatch],
  )

  const handleRemove = useCallback(
    (index: number) => {
      dispatch({ type: 'removePayment', index })
    },
    [dispatch],
  )

  const handleSetPaymentError = useCallback(
    (index: number, hasError: boolean) => {
      if (index === undefined) return

      dispatch({
        type: 'updateError',
        index,
        hasError,
      })
    },
    [dispatch],
  )

  const handleDomainAddress = useCallback(
    async ({ domain }: { domain: string }) => {
      if (!connection) return
      return fetchDomainOwner(connection, domain)
    },
    [connection],
  )

  const handleAddressError = useCallback(
    ({
      index,
      address,
      isHotspotOrValidator,
    }: {
      index: number
      address: string
      isHotspotOrValidator: boolean
    }) => {
      if (isHotspotOrValidator) {
        handleSetPaymentError(index, true)
        return
      }
      let invalidAddress = false

      // only handle address which include dots.
      if (address.split('.').length === 2) {
        // retrieve the address which has been set previously by handleEditAddress.
        address = paymentState.payments[index].address || ''
      }
      invalidAddress = !!address && !solAddressIsValid(address)

      const wrongNetType =
        address !== undefined &&
        address !== '' &&
        accountNetType(address) !== networkType
      handleSetPaymentError(index, invalidAddress || wrongNetType)
    },
    [handleSetPaymentError, networkType, paymentState],
  )

  const handleEditAddress = useCallback(
    async ({ index, address }: { index: number; address: string }) => {
      if (index === undefined || !currentAccount || !anchorProvider) return
      let domain = ''
      if (address.split('.').length === 2) {
        const resolvedAddress =
          (await handleDomainAddress({ domain: address })) || ''
        address = resolvedAddress
        // if the address is resolved then the domain could also be an alias/nickname of the address.
        if (resolvedAddress) domain = address
      }
      const allAccounts = unionBy(
        contacts,
        Object.values(accounts || {}),
        ({ address: addr }) => addr,
      )
      let contact = allAccounts.find((c) => c.address === address)
      if (!contact) contact = { address, netType: networkType, alias: domain }

      const createTokenAccountFee =
        await calcCreateAssociatedTokenAccountAccountFee(
          anchorProvider,
          address,
          new PublicKey(mint),
        )
      dispatch({
        type: 'updatePayee',
        index,
        address,
        contact,
        payer: currentAccount?.address,
        createTokenAccountFee,
      })
    },
    [
      accounts,
      contacts,
      currentAccount,
      dispatch,
      networkType,
      anchorProvider,
      mint,
      handleDomainAddress,
    ],
  )

  const handleContactSelected = useCallback(
    async ({
      contact,
      index,
    }: {
      contact: CSAccount
      prevAddress?: string
      index?: number
    }) => {
      if (index === undefined || !currentNetworkAddress) return

      const payee = contact.solanaAddress
      const payer = currentNetworkAddress

      if (!payee || !payer || !anchorProvider) return

      const createTokenAccountFee =
        await calcCreateAssociatedTokenAccountAccountFee(
          anchorProvider,
          payee,
          new PublicKey(mint),
        )

      dispatch({
        type: 'updatePayee',
        contact,
        index,
        address: payee,
        payer,
        createTokenAccountFee,
      })
    },
    [currentNetworkAddress, dispatch, anchorProvider, mint],
  )

  const handleAddPayee = useCallback(() => {
    dispatch({ type: 'addPayee' })
  }, [dispatch])

  const containerStyle = useMemo(() => {
    // if navigation cannot go back then this is not being presented in a modal so we need top margin
    return {
      marginTop:
        Platform.OS === 'android' || !navigation.canGoBack() ? top : undefined,
    }
  }, [navigation, top])

  const handleShowAccounts = useCallback(() => {
    if (!accountSelectorRef?.current) return

    let accts = [] as CSAccount[]
    accts = sortedAccountsForNetType(NetTypes.MAINNET)
    if (accts.length < 2) return

    const netType = NetTypes.MAINNET

    accountSelectorRef?.current.showAccountTypes(netType)()
  }, [sortedAccountsForNetType])

  const tokenButtonBalance = useMemo(() => {
    switch (ticker) {
      case 'HNT':
        return balanceToString(hntBalance)
      case 'SOL':
        return balanceToString(solBalance)
      case 'MOBILE':
        return balanceToString(mobileBalance)
      case 'IOT':
        return balanceToString(iotBalance)
    }
  }, [ticker, hntBalance, solBalance, mobileBalance, iotBalance])

  const data = useMemo((): TokenListItem[] => {
    const tokens = [
      {
        label: 'HNT',
        icon: <TokenHNT width={30} height={30} color={white} />,
        value: 'HNT' as Ticker,
        selected: ticker === 'HNT',
      },
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
      {
        label: 'SOL',
        icon: <TokenSOL width={30} height={30} />,
        value: 'SOL' as Ticker,
        selected: ticker === 'SOL',
      },
    ]

    return tokens
  }, [blueBright500, white, ticker])

  return (
    <>
      <HNTKeyboard
        ref={hntKeyboardRef}
        onConfirmBalance={handleBalance}
        ticker={ticker}
        networkFee={paymentState.networkFee}
      >
        <AccountSelector ref={accountSelectorRef}>
          <AddressBookSelector
            ref={addressBookRef}
            onContactSelected={handleContactSelected}
            hideCurrentAccount
          >
            <TokenSelector
              ref={tokenSelectorRef}
              onTokenSelected={onTickerSelected}
              tokenData={data}
            >
              <Box
                flex={1}
                style={containerStyle}
                borderTopStartRadius="xl"
                borderTopEndRadius="xl"
                backgroundColor="secondaryBackground"
              >
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  borderTopStartRadius="xl"
                  borderTopEndRadius="xl"
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
                    textAlign="center"
                    color="primaryText"
                    maxFontSizeMultiplier={1}
                  >
                    {t('payment.send')}
                  </Text>
                  <Box hitSlop={hitSlop} padding="s">
                    <IconPressedContainer
                      onPress={navBack}
                      activeOpacity={0.75}
                      idleOpacity={1.0}
                    >
                      <Close color={primaryText} height={16} width={16} />
                    </IconPressedContainer>
                  </Box>
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
                    title={t('payment.title', { ticker: currencyType.ticker })}
                    subtitle={tokenButtonBalance}
                    address={currentAccount?.address}
                    onPress={handleTokenTypeSelected}
                    showBubbleArrow
                    marginHorizontal="l"
                    ticker={ticker}
                  />

                  {paymentState.payments.map((p, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={index}>
                      <PaymentItem
                        {...p}
                        hideMemo
                        marginTop={index === 0 ? 'xs' : 'none'}
                        marginBottom="l"
                        hasError={
                          p.address === currentAccount?.address || p.hasError
                        }
                        index={index}
                        onAddressBookSelected={handleAddressBookSelected}
                        onEditAmount={handleEditAmount}
                        onToggleMax={handleToggleMax}
                        onEditAddress={handleEditAddress}
                        handleAddressError={handleAddressError}
                        onUpdateError={handleSetPaymentError}
                        ticker={currencyType.ticker}
                        onRemove={
                          paymentState.payments.length > 1
                            ? handleRemove
                            : undefined
                        }
                        netType={networkType}
                        showAmount
                      />
                    </React.Fragment>
                  ))}
                  {canAddPayee && (
                    <TouchableOpacityBox
                      minHeight={75}
                      onPress={handleAddPayee}
                      borderRadius="xl"
                      overflow="hidden"
                      marginHorizontal="l"
                      marginBottom="l"
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="secondary"
                    >
                      <Text variant="body1" color="surfaceSecondaryText">
                        {t('payment.addRecipient')}
                      </Text>
                    </TouchableOpacityBox>
                  )}
                </KeyboardAwareScrollView>

                <PaymentCard
                  ticker={ticker}
                  totalBalance={paymentState.totalAmount}
                  feeTokenBalance={paymentState.networkFee}
                  disabled={!isFormValid}
                  onSubmit={handleSubmit}
                  payments={payments}
                  errors={errors}
                  handleCancel={navBack}
                />
              </Box>
            </TokenSelector>
          </AddressBookSelector>
        </AccountSelector>
      </HNTKeyboard>
      <PaymentSubmit
        submitLoading={!!solanaPayment?.loading}
        submitSucceeded={!!solanaPayment?.success}
        submitError={solanaPayment?.error}
        totalBalance={paymentState.totalAmount}
        payments={paymentState.payments}
        feeTokenBalance={paymentState.networkFee}
        onRetry={handleSubmit}
        onSuccess={navigation.popToTop}
        actionTitle={t('payment.backToAccounts')}
      />
    </>
  )
}

export default reactMemo(PaymentScreen)
