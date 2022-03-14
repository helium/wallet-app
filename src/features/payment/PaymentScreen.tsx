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
  DataCredits,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { Keyboard, Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Address } from '@helium/crypto-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  networkCurrencyType,
} from '../../utils/accountUtils'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAccountSelector } from '../../components/AccountSelector'
import { useAccountQuery } from '../../generated/graphql'
import AccountButton from '../../components/AccountButton'
import AddressBookSelector, {
  AddressBookRef,
} from '../../components/AddressBookSelector'
import { useTransactions } from '../../storage/TransactionProvider'
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
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)

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

  const networkType = useMemo(() => {
    if (!route.params) {
      return accountNetType(currentAccount?.address)
    }

    const linkedPayments = parseLinkedPayments(route.params)
    if (!linkedPayments?.length) return accountNetType()

    return accountNetType(linkedPayments[0].payee)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  const currencyType = useMemo(
    () => networkCurrencyType(networkType),
    [networkType],
  )

  const [state, dispatch] = usePaymentsReducer({ currencyType, networkType })

  const { showAccountTypes } = useAccountSelector()
  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
  })

  const {
    data: submitData,
    loading: submitLoading,
    error: submitError,
    submit,
  } = useSubmitTxn()

  const [fee, setFee] = useState<Balance<DataCredits>>()
  const { calculatePaymentTxnFee } = useTransactions()
  const { zeroBalanceNetworkToken, dcToTokens } = useBalance()
  const { top } = useSafeAreaInsets()

  const accountHntBalance = useMemo(() => {
    if (
      !accountData?.account ||
      accountData.account?.address !== currentAccount?.address
    ) {
      return
    }
    return new Balance(accountData.account?.balance || 0, currencyType)
  }, [accountData, currencyType, currentAccount])

  useEffect(() => {
    if (!route.params) return

    // Deep link handling
    const {
      params: { payer },
    } = route
    let nextAccount = accounts?.[payer || '']
    if (!nextAccount) {
      const acctsForNetType = sortedAccountsForNetType(networkType)
      if (!acctsForNetType.length) {
        // They don't have an account that can handle a payment for this network type
        navigation.goBack()
        return
      }
      const [firstAcct] = acctsForNetType
      nextAccount = firstAcct
    }
    setCurrentAccount(nextAccount)

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
      payee: string
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

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToTokens(fee)
  }, [dcToTokens, fee])

  useEffect(() => {
    if (!currentAccount?.address) return

    const payments = state.payments.map((p) => ({
      payee: currentAccount?.address,
      balanceAmount: p.amount || zeroBalanceNetworkToken,
      memo: '',
    }))
    calculatePaymentTxnFee(payments).then(setFee)
  }, [
    calculatePaymentTxnFee,
    currentAccount,
    zeroBalanceNetworkToken,
    state.payments,
    state,
  ])

  const onRequestClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const canAddPayee = useMemo(() => {
    const lastPayee = state.payments[state.payments.length - 1]

    return (
      state.payments.length < MAX_PAYMENTS &&
      !!lastPayee.address &&
      !!lastPayee.amount &&
      lastPayee.amount.integerBalance > 0
    )
  }, [state.payments])

  const handleSubmit = useCallback(() => {
    const payments = state.payments.flatMap((p) => {
      if (!p.address || !p.amount) return []
      return [
        {
          payee: p.address,
          balanceAmount: p.amount,
          memo: p.memo || '',
        },
      ]
    })

    submit(payments)
  }, [state.payments, submit])

  const insufficientFunds = useMemo(() => {
    if (
      !accountHntBalance?.integerBalance ||
      feeAsTokens?.integerBalance === undefined ||
      !state.totalAmount
    ) {
      return true
    }
    try {
      return (
        accountHntBalance.integerBalance <
        state.totalAmount.plus(feeAsTokens).integerBalance
      )
    } catch (e) {
      // if the screen was already open, then a deep link of a different net type
      // is selected there will be a brief arithmetic error that can be ignored.
      console.warn(e)
      return false
    }
  }, [accountHntBalance, feeAsTokens, state])

  const selfPay = useMemo(
    () => state.payments.find((p) => p.address === currentAccount?.address),
    [currentAccount, state.payments],
  )

  const errors = useMemo(() => {
    const errStrings: string[] = []
    if (insufficientFunds) {
      errStrings.push(t('payment.insufficientFunds'))
    }

    if (selfPay) {
      errStrings.push(t('payment.selfPay'))
    }
    return errStrings
  }, [insufficientFunds, selfPay, t])

  const isFormValid = useMemo(() => {
    if (
      selfPay ||
      !accountHntBalance?.integerBalance ||
      !feeAsTokens?.integerBalance
    ) {
      return false
    }

    const paymentsValid =
      state.payments.length &&
      state.payments.every((p) => {
        const addressValid = p.address && Address.isValid(p.address)
        const paymentValid = p.amount && p.amount.integerBalance > 0
        const memoValid = getMemoStrValid(p.memo)
        return addressValid && paymentValid && memoValid
      })

    return paymentsValid && !insufficientFunds
  }, [
    accountHntBalance,
    feeAsTokens,
    insufficientFunds,
    selfPay,
    state.payments,
  ])

  const handleAddressBookSelected = useCallback(
    ({ address, index }: { address?: string | undefined; index: number }) => {
      addressBookRef?.current?.showAddressBook({ address, index })
    },
    [],
  )

  const handleEditHNTAmount = useCallback(
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
    [dispatch, currentAccount],
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
      <HNTKeyboard ref={hntKeyboardRef} onConfirmBalance={handleBalance}>
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
        >
          <Box
            backgroundColor="primaryBackground"
            flex={1}
            style={containerStyle}
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
                {t('payment.title', { ticker: currencyType.ticker })}
              </Text>
              <TouchableOpacityBox
                onPress={onRequestClose}
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
                paddingTop="xxl"
                title={formatAccountAlias(currentAccount)}
                subtitle={balanceToString(accountHntBalance, {
                  maxDecimalPlaces: 2,
                })}
                showChevron={sortedAccountsForNetType(networkType).length > 1}
                address={currentAccount?.address}
                netType={currentAccount?.netType}
                onPress={handleShowAccounts}
                showBubbleArrow
                marginHorizontal="l"
              />

              {state.payments.map((p, index) => (
                <PaymentItem
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  hasError={p.address === currentAccount?.address}
                  address={p.address}
                  account={p.account}
                  amount={p.amount}
                  fee={state.payments.length === 1 ? fee : undefined}
                  index={index}
                  onAddressBookSelected={handleAddressBookSelected}
                  onEditHNTAmount={handleEditHNTAmount}
                  memo={p.memo}
                  onEditMemo={handleEditMemo}
                  onRemove={
                    state.payments.length > 1 ? handleRemove : undefined
                  }
                />
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
              totalBalance={state.totalAmount}
              feeTokenBalance={feeAsTokens}
              disabled={!isFormValid}
              onSubmit={handleSubmit}
              payments={state.payments}
              errors={errors}
            />
          </Box>
        </AddressBookSelector>
      </HNTKeyboard>
      <PaymentSubmit
        submitLoading={submitLoading}
        submitSucceeded={!!submitData?.submitTxn?.hash}
        submitError={submitError}
        totalBalance={state.totalAmount}
        payments={state.payments}
        feeTokenBalance={feeAsTokens}
        onRetry={handleSubmit}
      />
    </>
  )
}

export default reactMemo(PaymentScreen)
