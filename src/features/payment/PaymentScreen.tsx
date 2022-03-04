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
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import {
  accountCurrencyType,
  formatAccountAlias,
} from '../../utils/accountUtils'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAccountSelector } from '../../components/AccountSelector'
import { useAccountQuery, useSubmitTxnMutation } from '../../generated/graphql'
import AccountButton from '../../components/AccountButton'
import AddressBookSelector, {
  AddressBookRef,
} from '../../components/AddressBookSelector'
import { useTransactions } from '../../storage/TransactionProvider'
import {
  balanceToString,
  useBalance,
  useAccountBalances,
} from '../../utils/Balance'
import { useAppStorage } from '../../storage/AppStorageProvider'
import PaymentItem from './PaymentItem'
import usePaymentsReducer, { MAX_PAYMENTS } from './usePaymentsReducer'
import BackgroundFill from '../../components/BackgroundFill'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import PaymentCard from './PaymentCard'
import { getMemoStrValid } from '../../components/MemoInput'
import PaymentSubmit from './PaymentSubmit'
import { CSAccount } from '../../storage/cloudStorage'

type Route = RouteProp<HomeStackParamList, 'PaymentScreen'>
const PaymentScreen = () => {
  const route = useRoute<Route>()
  const addressBookRef = useRef<AddressBookRef>(null)
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const [state, dispatch] = usePaymentsReducer()

  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('l')
  const { currentAccount, accounts, contacts, setCurrentAccount } =
    useAccountStorage()
  const { updateLocked, requirePinForPayment, pin } = useAppStorage()
  const { showAccountTypes } = useAccountSelector()
  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
  })
  const [
    submitTxnMutation,
    { data: submitData, loading: submitLoading, error: submitError },
  ] = useSubmitTxnMutation()

  const balances = useAccountBalances(accountData?.account)
  const [fee, setFee] = useState<Balance<DataCredits>>()
  const { calculatePaymentTxnFee, makePaymentTxn } = useTransactions()
  const { intToBalance, zeroBalanceNetworkToken, dcToTokens } = useBalance()
  const { top } = useSafeAreaInsets()

  useEffect(() => {
    if (!route.params) return

    // Deep link handling
    const {
      params: { payer, payee, payments, amount, memo },
    } = route

    const account = accounts?.[payer || '']
    if (account) {
      setCurrentAccount(account)
      dispatch({ type: 'updatePayer', address: account.address })
    }

    let paymentsArr: Array<{ amount?: string; memo?: string; payee: string }> =
      []
    if (payments) {
      paymentsArr = JSON.parse(payments) as Array<{
        amount?: string
        memo: string
        payee: string
      }>
    } else if (payee) {
      paymentsArr = [
        {
          payee,
          amount,
          memo,
        },
      ]
    }

    if (!paymentsArr.length) return

    if (paymentsArr.find((p) => !Address.isValid(p.payee))) {
      throw new Error('Invalid address found in deep link')
    }

    dispatch({
      type: 'addLinkedPayments',
      payer,
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
  }, [accounts, contacts, dispatch, intToBalance, route, setCurrentAccount])

  const handleBalance = useCallback(
    (opts: {
      balance: Balance<NetworkTokens | TestNetworkTokens>
      payee: string
      index?: number
    }) => {
      if (opts.index === undefined) return

      dispatch({
        type: 'updateBalance',
        value: opts.balance,
        address: opts.payee,
        index: opts.index,
      })
    },
    [dispatch],
  )

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToTokens(fee)
  }, [dcToTokens, fee])

  const currencyType = useMemo(
    () => accountCurrencyType(currentAccount?.address),
    [currentAccount],
  )

  useEffect(() => {
    if (!requirePinForPayment || !pin) return
    updateLocked(true)
  }, [pin, requirePinForPayment, updateLocked])

  useEffect(() => {
    if (!currentAccount?.address) return

    // If payer updates we need to alert the reducer.
    // The net type may be different which would trigger a reset of the payees
    dispatch({ type: 'updatePayer', address: currentAccount?.address })
  }, [currentAccount, dispatch])

  useEffect(() => {
    if (!currentAccount?.address) return

    calculatePaymentTxnFee(
      state.payments.map((p) => ({
        payee: currentAccount?.address,
        balanceAmount: p.amount || zeroBalanceNetworkToken,
        memo: '',
      })),
    ).then(setFee)
  }, [
    calculatePaymentTxnFee,
    currentAccount,
    zeroBalanceNetworkToken,
    state.payments,
  ])

  const onRequestClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const canAddPayee = useMemo(() => {
    const lastPayee = state.payments[state.payments.length - 1]

    return (
      state.payments.length < MAX_PAYMENTS &&
      lastPayee.address &&
      lastPayee.amount &&
      lastPayee.amount.integerBalance > 0
    )
  }, [state.payments])

  const handleSubmit = useCallback(async () => {
    if (!currentAccount?.address) return
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
    const { partialTxn, signedTxn } = await makePaymentTxn(payments)
    submitTxnMutation({
      variables: {
        address: currentAccount.address,
        txnJson: JSON.stringify(partialTxn),
        txn: signedTxn.toString(),
      },
    })
  }, [currentAccount, makePaymentTxn, state.payments, submitTxnMutation])

  const insufficientFunds = useMemo(() => {
    if (!balances?.hnt.integerBalance || !feeAsTokens?.integerBalance) {
      return true
    }
    return (
      balances?.hnt.integerBalance <
      state.totalAmount.plus(feeAsTokens).integerBalance
    )
  }, [balances, feeAsTokens, state.totalAmount])

  const isFormValid = useMemo(() => {
    if (!balances?.hnt.integerBalance || !feeAsTokens?.integerBalance) {
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
  }, [balances, feeAsTokens, insufficientFunds, state.payments])

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
      if (index === undefined) return
      dispatch({
        type: 'updatePayee',
        contact,
        index,
        address: contact.address,
      })
    },
    [dispatch],
  )

  const handleAddPayee = useCallback(() => {
    dispatch({ type: 'addPayee' })
  }, [dispatch])

  const containerStyle = useMemo(
    () => ({ marginTop: Platform.OS === 'android' ? top : undefined }),
    [top],
  )

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
                onPress={onRequestClose}
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
                subtitle={balanceToString(balances?.hnt, {
                  maxDecimalPlaces: 2,
                })}
                address={currentAccount?.address}
                netType={currentAccount?.netType}
                onPress={showAccountTypes(
                  currentAccount?.netType !== undefined
                    ? currentAccount.netType
                    : 'all',
                )}
                showBubbleArrow
                marginHorizontal="l"
              />

              {state.payments.map((p, index) => (
                <PaymentItem
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
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
              insufficientFunds={insufficientFunds}
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
