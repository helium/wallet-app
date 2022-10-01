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
import Address from '@helium/address'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PaymentV2 } from '@helium/transactions'
import { unionBy } from 'lodash'
import Toast from 'react-native-simple-toast'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAsync } from 'react-async-hook'
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
import { accountNetType, formatAccountAlias } from '../../utils/accountUtils'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAccountSelector } from '../../components/AccountSelector'
import TokenSelector, { TokenSelectorRef } from '../../components/TokenSelector'
import { TokenType } from '../../generated/graphql'
import AccountButton from '../../components/AccountButton'
import AddressBookSelector, {
  AddressBookRef,
} from '../../components/AddressBookSelector'
import { SendDetails } from '../../storage/TransactionProvider'
import { balanceToString, useBalance } from '../../utils/Balance'
import PaymentItem from './PaymentItem'
import usePaymentsReducer, { MAX_PAYMENTS } from './usePaymentsReducer'
import BackgroundFill from '../../components/BackgroundFill'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import PaymentCard from './PaymentCard'
import { getMemoStrValid } from '../../components/MemoInput'
import PaymentSubmit from './PaymentSubmit'
import { CSAccount } from '../../storage/cloudStorage'
import useSubmitTxn from '../../graphql/useSubmitTxn'
import useAlert from '../../utils/useAlert'

type LinkedPayment = {
  amount?: string
  memo: string
  payee: string
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
    accountNetworkBalance,
    accountMobileBalance,
    oraclePrice,
  } = useBalance()

  const { showOKAlert } = useAlert()

  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('l')
  const {
    currentAccount,
    accounts,
    contacts,
    setCurrentAccount,
    sortedAccountsForNetType,
  } = useAccountStorage()
  const [tokenType, setTokenType] = useState<TokenType>(
    route.params?.defaultTokenType || TokenType.Hnt,
  )

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

  const [state, dispatch] = usePaymentsReducer({
    currencyType,
    oraclePrice,
    accountMobileBalance,
    accountNetworkBalance,
    netType: networkType,
  })

  const { showAccountTypes } = useAccountSelector()

  const {
    data: submitData,
    loading: submitLoading,
    error: submitError,
    submit,
    submitLedger,
  } = useSubmitTxn()

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

    if (paymentsArr.find((p) => !Address.isValid(p.payee))) {
      throw new Error('Invalid address found in deep link')
    }

    dispatch({
      type: 'addLinkedPayments',
      payments: paymentsArr.map((p) => {
        const contact = contacts.find(({ address }) => address === p.payee)
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
    const lastPayee = state.payments[state.payments.length - 1]

    return (
      state.payments.length < MAX_PAYMENTS &&
      !!lastPayee.address &&
      !!lastPayee.amount &&
      lastPayee.amount.integerBalance > 0
    )
  }, [currentAccount, state.payments])

  const payments = useMemo(
    (): Array<SendDetails> =>
      state.payments.flatMap((p) => {
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
    [state.payments],
  )

  const handleSubmit = useCallback(
    (opts?: { txn: PaymentV2; txnJson: string }) => {
      if (!opts) {
        submit(payments, tokenType)
      } else {
        // This is a ledger device
        submitLedger(opts)
      }
    },
    [payments, submit, submitLedger, tokenType],
  )

  const insufficientFunds = useMemo((): [
    value: boolean,
    errorTicker: string,
  ] => {
    if (!accountNetworkBalance || !accountMobileBalance || !state.totalAmount) {
      return [true, '']
    }
    if (state.networkFee?.integerBalance === undefined) return [false, '']
    try {
      if (tokenType === TokenType.Mobile) {
        // If paying with mobile, they need to have enough mobile to cover the payment
        // and enough hnt to cover the fee
        const hasEnoughNetwork =
          accountNetworkBalance.minus(state.networkFee).integerBalance >= 0
        const hasEnoughMobile =
          accountMobileBalance.minus(state.totalAmount).integerBalance >= 0
        if (!hasEnoughNetwork) return [true, accountNetworkBalance.type.ticker]
        if (!hasEnoughMobile) return [true, accountMobileBalance.type.ticker]
      }

      const hasEnoughNetwork =
        accountNetworkBalance.integerBalance <
        state.totalAmount.plus(state.networkFee).integerBalance
      return [
        hasEnoughNetwork,
        hasEnoughNetwork ? '' : accountNetworkBalance.type.ticker,
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
    accountMobileBalance,
    accountNetworkBalance,
    state.networkFee,
    state.totalAmount,
    tokenType,
  ])

  const selfPay = useMemo(
    () => state.payments.find((p) => p.address === currentAccount?.address),
    [currentAccount, state.payments],
  )

  const wrongNetTypePay = useMemo(
    () =>
      state.payments.find((p) => {
        if (!p.address || !Address.isValid(p.address)) return false
        return accountNetType(p.address) !== currentAccount?.netType
      }),
    [currentAccount, state.payments],
  )

  const errors = useMemo(() => {
    const errStrings: string[] = []

    if (!!currentAccount?.ledgerDevice && state.payments.length > 1) {
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
    state.payments.length,
    t,
    wrongNetTypePay,
  ])

  const isFormValid = useMemo(() => {
    if (
      selfPay ||
      !state.networkFee?.integerBalance ||
      (!!currentAccount?.ledgerDevice && state.payments.length > 1) // ledger payments are limited to one payee
    ) {
      return false
    }

    const paymentsValid =
      state.payments.length &&
      state.payments.every((p) => {
        const addressValid = p.address && Address.isValid(p.address)
        const paymentValid = p.amount && p.amount.integerBalance > 0
        const memoValid = getMemoStrValid(p.memo)
        return addressValid && paymentValid && memoValid && !p.hasError
      })

    return paymentsValid && !insufficientFunds[0]
  }, [
    currentAccount,
    insufficientFunds,
    selfPay,
    state.networkFee,
    state.payments,
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
        balance: state.payments[index].amount,
        index,
        payments: state.payments,
      })
    },
    [currentAccount, state.payments],
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
      const invalidAddress = !!address && !Address.isValid(address)
      const wrongNetType =
        address !== undefined &&
        address !== '' &&
        accountNetType(address) !== networkType
      handleSetPaymentError(index, invalidAddress || wrongNetType)
    },
    [handleSetPaymentError, networkType],
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
      if (index === undefined || !currentAccount) return
      dispatch({
        type: 'updatePayee',
        contact,
        index,
        address: contact.address,
        payer: currentAccount?.address,
      })
    },
    [currentAccount, dispatch],
  )

  const handleAddPayee = useCallback(() => {
    dispatch({ type: 'addPayee' })
  }, [dispatch])

  const containerStyle = useMemo(
    () => ({ marginTop: Platform.OS === 'android' ? top : undefined }),
    [top],
  )

  const handleShowAccounts = useCallback(() => {
    if (sortedAccountsForNetType(networkType).length <= 1) {
      return
    }

    showAccountTypes(networkType)()
  }, [networkType, showAccountTypes, sortedAccountsForNetType])

  return (
    <>
      <HNTKeyboard
        ref={hntKeyboardRef}
        onConfirmBalance={handleBalance}
        tokenType={tokenType}
        networkFee={state.networkFee}
      >
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
        >
          <TokenSelector
            ref={tokenSelectorRef}
            onTokenSelected={onTokenSelected}
          >
            <Box
              backgroundColor="secondaryBackground"
              flex={1}
              style={containerStyle}
              borderTopStartRadius="xxl"
              borderTopEndRadius="xxl"
            >
              <Box
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
                  Send
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
                  accountIconSize={40}
                  paddingTop="l"
                  title={formatAccountAlias(currentAccount)}
                  subtitle="Sender Account"
                  showChevron={sortedAccountsForNetType(networkType).length > 1}
                  address={currentAccount?.address}
                  netType={currentAccount?.netType}
                  onPress={handleShowAccounts}
                  showBubbleArrow
                  marginHorizontal="l"
                />

                <TokenButton
                  paddingTop="l"
                  title={t('payment.title', { ticker: currencyType.ticker })}
                  subtitle={balanceToString(
                    tokenType === 'hnt'
                      ? accountNetworkBalance
                      : accountMobileBalance,
                  )}
                  address={currentAccount?.address}
                  netType={currentAccount?.netType}
                  onPress={handleTokenTypeSelected}
                  showBubbleArrow
                  marginHorizontal="l"
                  tokenType={tokenType}
                />

                {state.payments.map((p, index) => (
                  <>
                    <PaymentItem
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      hasError={
                        p.address === currentAccount?.address || p.hasError
                      }
                      address={p.address}
                      account={p.account}
                      amount={p.amount}
                      max={p.max}
                      memo={p.memo}
                      fee={
                        state.payments.length === 1 ? state.dcFee : undefined
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
                        state.payments.length > 1 ? handleRemove : undefined
                      }
                      netType={networkType}
                    />
                  </>
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
                  >
                    <BackgroundFill backgroundColor="surface" opacity={0.2} />
                    <Text variant="body1" color="surfaceSecondaryText">
                      {t('payment.addRecipient')}
                    </Text>
                  </TouchableOpacityBox>
                )}
              </KeyboardAwareScrollView>

              <PaymentCard
                tokenType={tokenType}
                totalBalance={state.totalAmount}
                feeTokenBalance={state.networkFee}
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
        submitLoading={submitLoading}
        submitSucceeded={!!submitData?.submitTxn?.hash}
        submitError={submitError}
        totalBalance={state.totalAmount}
        payments={state.payments}
        feeTokenBalance={state.networkFee}
        onRetry={handleSubmit}
        onSuccess={navigation.popToTop}
        actionTitle={t('payment.backToAccounts')}
      />
    </>
  )
}

export default reactMemo(PaymentScreen)
