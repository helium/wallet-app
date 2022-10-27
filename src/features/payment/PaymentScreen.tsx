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
import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import { Keyboard, Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Address, { NetTypes } from '@helium/address'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PaymentV2 } from '@helium/transactions'
import { unionBy } from 'lodash'
import Toast from 'react-native-simple-toast'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAsync } from 'react-async-hook'
import { useSelector } from 'react-redux'
import TokenButton from '../../components/TokenButton'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useHitSlop } from '../../theme/themeHooks'
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
import { useAccountSelector } from '../../components/AccountSelector'
import TokenSelector, { TokenSelectorRef } from '../../components/TokenSelector'
import AccountButton from '../../components/AccountButton'
import AddressBookSelector, {
  AddressBookRef,
} from '../../components/AddressBookSelector'
import { SendDetails } from '../../storage/TransactionProvider'
import { balanceToString, useBalance } from '../../utils/Balance'
import PaymentItem from './PaymentItem'
import usePaymentsReducer, { MAX_PAYMENTS } from './usePaymentsReducer'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import PaymentCard from './PaymentCard'
import { getMemoStrValid } from '../../components/MemoInput'
import PaymentSubmit from './PaymentSubmit'
import { CSAccount } from '../../storage/cloudStorage'
import useSubmitTxn from '../../graphql/useSubmitTxn'
import useAlert from '../../utils/useAlert'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { RootState } from '../../store/rootReducer'
import { useAppDispatch } from '../../store/store'
import useDisappear from '../../utils/useDisappear'
import { solanaSlice } from '../../store/slices/solanaSlice'
import useNetworkColor from '../../utils/useNetworkColor'
import { TokenType } from '../../types/activity'

type LinkedPayment = {
  amount?: string
  memo: string
  payee: string
  defaultTokenType?: TokenType
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
        memo: opts.memo || '',
        defaultTokenType: opts.defaultTokenType,
      },
    ]
  }
  return []
}

type Route = RouteProp<HomeStackParamList, 'PaymentScreen'>
const PaymentScreen = () => {
  const route = useRoute<Route>()
  const addressBookRef = useRef<AddressBookRef>(null)
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const {
    currencyTypeFromTokenType,
    oraclePrice,
    networkBalance,
    solBalance,
    mobileBalance,
  } = useBalance()

  const { showOKAlert } = useAlert()
  const { l1Network } = useAppStorage()
  const appDispatch = useAppDispatch()

  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('l')
  const {
    currentAccount,
    currentNetworkAddress,
    accounts,
    contacts,
    setCurrentAccount,
    sortedAccountsForNetType,
  } = useAccountStorage()
  const [tokenType, setTokenType] = useState<TokenType>(
    route.params?.defaultTokenType || TokenType.Hnt,
  )

  useDisappear(() => {
    appDispatch(solanaSlice.actions.resetPayment())
  })

  useAsync(async () => {
    if (tokenType !== TokenType.Mobile) return

    const mobilePromptShown = await AsyncStorage.getItem('mobilePaymentPrompt')
    if (mobilePromptShown === 'true') return

    await showOKAlert({
      title: t('payment.mobilePrompt.title'),
      message: t('payment.mobilePrompt.message'),
    })
    AsyncStorage.setItem('mobilePaymentPrompt', 'true')
  }, [tokenType])

  const networkType = useMemo(() => {
    if (!route.params || !route.params.payer) {
      return accountNetType(currentAccount?.address)
    }

    const linkedPayments = parseLinkedPayments(route.params)
    if (!linkedPayments?.length) return accountNetType()

    return accountNetType(linkedPayments[0].payee)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  const currencyType = useMemo(
    () => currencyTypeFromTokenType(tokenType),
    [currencyTypeFromTokenType, tokenType],
  )

  const [paymentState, dispatch] = usePaymentsReducer({
    currencyType,
    oraclePrice,
    accountMobileBalance: mobileBalance,
    accountNetworkBalance: networkBalance,
    netType: networkType,
    l1Network,
  })

  const { showAccountTypes } = useAccountSelector()
  const backgroundColor = useNetworkColor({ netType: currentAccount?.netType })

  const {
    data: submitData,
    loading: paymentSubmitLoading,
    error: submitError,
    submit,
    submitLedger,
  } = useSubmitTxn()

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
        navigation.goBack()
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
      onTokenSelected(paymentsArr[0].defaultTokenType)
    }

    if (
      paymentsArr.find((p) => {
        if (l1Network === 'helium') return !Address.isValid(p.payee)
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
          memo: p.memo,
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
            memo: p.memo || '',
            max: p.max,
          },
        ]
      }),
    [paymentState.payments],
  )

  const handleSubmit = useCallback(
    (opts?: { txn: PaymentV2; txnJson: string }) => {
      try {
        if (!opts) {
          submit(payments, tokenType)
        } else {
          // This is a ledger device
          submitLedger(opts)
        }
      } catch (e) {
        console.error(e)
      }
    },
    [payments, submit, submitLedger, tokenType],
  )

  const insufficientFunds = useMemo((): [
    value: boolean,
    errorTicker: string,
  ] => {
    if (!networkBalance || !mobileBalance || !paymentState.totalAmount) {
      return [true, '']
    }
    if (paymentState.networkFee?.integerBalance === undefined)
      return [false, '']
    try {
      if (l1Network === 'solana_dev') {
        const hasEnoughSol =
          solBalance.minus(paymentState.networkFee).integerBalance >= 0
        let hasEnoughToken = false
        if (tokenType === TokenType.Mobile) {
          hasEnoughToken =
            mobileBalance.minus(paymentState.totalAmount).integerBalance >= 0
        } else if (tokenType === TokenType.Hnt) {
          hasEnoughToken =
            networkBalance.minus(paymentState.totalAmount).integerBalance >= 0
        }
        if (!hasEnoughSol) return [true, solBalance.type.ticker]
        if (!hasEnoughToken) return [true, paymentState.totalAmount.type.ticker]
        return [false, '']
      }

      if (tokenType === TokenType.Mobile) {
        // If paying with mobile, they need to have enough mobile to cover the payment
        // and enough hnt to cover the fee
        const hasEnoughNetwork =
          networkBalance.minus(paymentState.networkFee).integerBalance >= 0
        const hasEnoughMobile =
          mobileBalance.minus(paymentState.totalAmount).integerBalance >= 0
        if (!hasEnoughNetwork) return [true, networkBalance.type.ticker]
        if (!hasEnoughMobile) return [true, mobileBalance.type.ticker]
      }

      const hasEnoughNetwork =
        networkBalance.integerBalance <
        paymentState.totalAmount.plus(paymentState.networkFee).integerBalance
      return [
        hasEnoughNetwork,
        hasEnoughNetwork ? '' : networkBalance.type.ticker,
      ]
    } catch (e) {
      // if the screen was already open, then a deep link of a different net type
      // is selected there will be a brief arithmetic error that can be ignored.
      if (__DEV__) {
        console.warn(e)
      }
      return [false, '']
    }
  }, [
    l1Network,
    mobileBalance,
    networkBalance,
    paymentState.networkFee,
    paymentState.totalAmount,
    solBalance,
    tokenType,
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
        let addressValid = false
        switch (l1Network) {
          case 'helium':
            addressValid = !!(p.address && Address.isValid(p.address))
            break
          case 'solana_dev':
            addressValid = !!(p.address && solAddressIsValid(p.address))
            break
        }

        const paymentValid = p.amount && p.amount.integerBalance > 0
        const memoValid = getMemoStrValid(p.memo)
        return addressValid && paymentValid && memoValid && !p.hasError
      })

    return paymentsValid && !insufficientFunds[0]
  }, [
    currentAccount,
    insufficientFunds,
    l1Network,
    selfPay,
    paymentState.networkFee,
    paymentState.payments,
  ])

  const handleTokenTypeSelected = useCallback(() => {
    tokenSelectorRef?.current?.showTokens()
  }, [])

  const onTokenSelected = useCallback(
    (token: TokenType) => {
      setTokenType(token)

      dispatch({
        type: 'changeToken',
        currencyType: currencyTypeFromTokenType(token),
      })
    },
    [currencyTypeFromTokenType, dispatch],
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

  const handleEditMemo = useCallback(
    ({
      index,
      memo,
    }: {
      address?: string | undefined
      index: number
      memo: string
    }) => {
      dispatch({ type: 'updateMemo', index, memo })
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

      switch (l1Network) {
        case 'helium':
          invalidAddress = !!address && !Address.isValid(address)
          break
        case 'solana_dev':
          invalidAddress = !!address && !solAddressIsValid(address)
          break
      }

      const wrongNetType =
        address !== undefined &&
        address !== '' &&
        accountNetType(address) !== networkType
      handleSetPaymentError(index, invalidAddress || wrongNetType)
    },
    [handleSetPaymentError, l1Network, networkType],
  )

  const handleEditAddress = useCallback(
    ({ index, address }: { index: number; address: string }) => {
      if (index === undefined || !currentAccount) return

      const allAccounts = unionBy(
        contacts,
        Object.values(accounts || {}),
        ({ address: addr }) => addr,
      )
      let contact = allAccounts.find((c) => c.address === address)
      if (!contact) contact = { address, netType: networkType, alias: '' }
      dispatch({
        type: 'updatePayee',
        index,
        address,
        contact,
        payer: currentAccount?.address,
      })
    },
    [accounts, contacts, currentAccount, dispatch, networkType],
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
      if (index === undefined || !currentNetworkAddress) return

      const payee =
        l1Network === 'helium' ? contact.address : contact.solanaAddress
      const payer = currentNetworkAddress

      if (!payee || !payer) return

      dispatch({
        type: 'updatePayee',
        contact,
        index,
        address: payee,
        payer,
      })
    },
    [currentNetworkAddress, dispatch, l1Network],
  )

  const handleAddPayee = useCallback(() => {
    dispatch({ type: 'addPayee' })
  }, [dispatch])

  const containerStyle = useMemo(
    () => ({ marginTop: Platform.OS === 'android' ? top : undefined }),
    [top],
  )

  const handleShowAccounts = useCallback(() => {
    let accts = [] as CSAccount[]
    if (l1Network === 'solana_dev') {
      accts = sortedAccountsForNetType(NetTypes.MAINNET)
    } else {
      accts = sortedAccountsForNetType(networkType)
    }
    if (accts.length < 2) return

    const netType = l1Network === 'solana_dev' ? NetTypes.MAINNET : networkType

    showAccountTypes(netType)()
  }, [l1Network, networkType, showAccountTypes, sortedAccountsForNetType])

  return (
    <>
      <HNTKeyboard
        ref={hntKeyboardRef}
        onConfirmBalance={handleBalance}
        tokenType={tokenType}
        networkFee={paymentState.networkFee}
      >
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
        >
          <TokenSelector
            ref={tokenSelectorRef}
            onTokenSelected={onTokenSelected}
          >
            <Box flex={1} style={containerStyle}>
              <Box
                backgroundColor={backgroundColor}
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <TouchableOpacityBox
                  onPress={handleQrScan}
                  padding="l"
                  hitSlop={hitSlop}
                >
                  <QR color={primaryText} height={16} width={16} />
                </TouchableOpacityBox>
                <Text
                  variant="subtitle2"
                  textAlign="center"
                  color="primaryText"
                  maxFontSizeMultiplier={1}
                >
                  {t('payment.send')}
                </Text>
                <TouchableOpacityBox
                  onPress={navigation.goBack}
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
                  showChevron={sortedAccountsForNetType(networkType).length > 1}
                  address={currentAccount?.address}
                  netType={currentAccount?.netType}
                  onPress={handleShowAccounts}
                  showBubbleArrow
                  marginHorizontal="l"
                  marginBottom="xs"
                />

                <TokenButton
                  backgroundColor="secondary"
                  title={t('payment.title', { ticker: currencyType.ticker })}
                  subtitle={balanceToString(
                    tokenType === 'hnt' ? networkBalance : mobileBalance,
                  )}
                  address={currentAccount?.address}
                  netType={currentAccount?.netType}
                  onPress={handleTokenTypeSelected}
                  showBubbleArrow
                  marginHorizontal="l"
                  tokenType={tokenType}
                />

                {paymentState.payments.map((p, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <React.Fragment key={index}>
                    <PaymentItem
                      {...p}
                      hideMemo={l1Network === 'solana_dev'}
                      marginTop={index === 0 ? 'xs' : 'none'}
                      marginBottom="l"
                      hasError={
                        p.address === currentAccount?.address || p.hasError
                      }
                      fee={
                        paymentState.payments.length === 1
                          ? paymentState.dcFee
                          : undefined
                      }
                      index={index}
                      onAddressBookSelected={handleAddressBookSelected}
                      onEditAmount={handleEditAmount}
                      onToggleMax={handleToggleMax}
                      onEditMemo={handleEditMemo}
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
                    marginVertical="l"
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
                tokenType={tokenType}
                totalBalance={paymentState.totalAmount}
                feeTokenBalance={paymentState.networkFee}
                disabled={!isFormValid}
                onSubmit={handleSubmit}
                payments={payments}
                errors={errors}
              />
            </Box>
          </TokenSelector>
        </AddressBookSelector>
      </HNTKeyboard>
      <PaymentSubmit
        submitLoading={paymentSubmitLoading || !!solanaPayment?.loading}
        submitSucceeded={
          !!submitData?.submitTxn?.hash || !!solanaPayment?.success
        }
        submitError={submitError || solanaPayment?.error}
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
