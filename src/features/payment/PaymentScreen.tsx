import React, { useCallback, useState, memo, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/close.svg'
import QR from '@assets/images/qr.svg'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Balance, { DataCredits } from '@helium/currency'
import { ActivityIndicator, Keyboard, LayoutChangeEvent } from 'react-native'
import { useAsync } from 'react-async-hook'
import { NetType } from '@helium/crypto-react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useHitSlop, useOpacity } from '../../theme/themeHooks'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import { accountCurrencyType, ellipsizeAddress } from '../../utils/accountUtils'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAccountSelector } from '../../components/AccountSelector'
import { useAccountQuery, useSubmitTxnMutation } from '../../generated/graphql'
import AccountButton from '../../components/AccountButton'
import {
  useAddressBookSelector,
  withAddressBookProvider,
} from '../../components/AddressBookSelector'
import SafeAreaBox, {
  useModalSafeAreaEdges,
} from '../../components/SafeAreaBox'
import MemoInput, { useMemoValid } from '../../components/MemoInput'
import SubmitButton from '../../components/SubmitButton'
import {
  useHNTKeyboardSelector,
  withHNTKeyboardProvider,
} from '../../components/HNTKeyboard'
import {
  EMPTY_B58_ADDRESS,
  useTransactions,
} from '../../storage/TransactionProvider'
import {
  balanceToString,
  useBalance,
  useAccountBalances,
} from '../../utils/Balance'
import useAlert from '../../utils/useAlert'
import TouchableWithoutFeedbackBox from '../../components/TouchableWithoutFeedbackBox'
import { decimalSeparator, groupSeparator } from '../../utils/i18n'
import { useAppStorage } from '../../storage/AppStorageProvider'

type Route = RouteProp<HomeStackParamList, 'PaymentScreen'>
const PaymentScreen = () => {
  const route = useRoute<Route>()
  const { address } = route.params
  const currencyType = accountCurrencyType(address)
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('l')
  const edges = useModalSafeAreaEdges()
  const [txnMemo, setTxnMemo] = useState('')
  const { valid: memoValid } = useMemoValid(txnMemo)
  const { currentAccount, currentContact } = useAccountStorage()
  const { updateLocked, requirePinForPayment } = useAppStorage()
  const { show: showAccountSelector } = useAccountSelector()
  const { show: showAddressBook } = useAddressBookSelector()
  const { show: showHNTKeyboard, value: tokenValue } = useHNTKeyboardSelector()
  const [containerHeight, setContainerHeight] = useState(0)
  const { colorStyle } = useOpacity('primaryText', 0.3)
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
  const { dcToTokens, floatToBalance } = useBalance()
  const { showOKAlert } = useAlert()

  const paymentAmount = useMemo(() => {
    const strippedVal = (tokenValue || '0')
      .replace(groupSeparator, '')
      .replace(decimalSeparator, '.')
    const numberVal = parseFloat(strippedVal)
    return floatToBalance(numberVal)
  }, [floatToBalance, tokenValue])

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToTokens(fee)
  }, [dcToTokens, fee])

  useEffect(() => {
    if (!requirePinForPayment) return
    updateLocked(true)
  }, [requirePinForPayment, updateLocked])

  useAsync(async () => {
    if (!submitError) return

    await showOKAlert({
      title: t('generic.error'),
      message: t('payment.submitError', { details: submitError.message }),
    })

    navigation.goBack()
  }, [showOKAlert, submitError, t, navigation])

  useAsync(async () => {
    if (!submitData?.submitTxn?.hash) return

    await showOKAlert({
      title: t('generic.success'),
      message: t('payment.submitSuccess', { hash: submitData.submitTxn.hash }),
    })

    navigation.goBack()
  }, [showOKAlert, submitData?.submitTxn?.hash, t, navigation])

  useEffect(() => {
    if (!paymentAmount) return

    calculatePaymentTxnFee([
      {
        address: EMPTY_B58_ADDRESS.b58,
        balanceAmount: paymentAmount,
        memo: '',
      },
    ]).then(setFee)
  }, [paymentAmount, calculatePaymentTxnFee])

  const onRequestClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleSubmit = useCallback(async () => {
    if (!currentAccount?.address || !currentContact?.address || !paymentAmount)
      return

    const txn = (
      await makePaymentTxn([
        {
          address: currentContact?.address,
          balanceAmount: paymentAmount,
          memo: txnMemo,
        },
      ])
    ).toString()

    submitTxnMutation({
      variables: {
        address: currentAccount.address,
        txn,
      },
    })
  }, [
    paymentAmount,
    currentAccount,
    currentContact,
    makePaymentTxn,
    submitTxnMutation,
    txnMemo,
  ])

  const isFormInvalid = useMemo(() => {
    if (!paymentAmount) return true

    const hasSufficientBalance =
      !!accountData?.account?.balance &&
      paymentAmount.integerBalance <= accountData.account.balance

    return (
      !memoValid ||
      !currentAccount?.address ||
      !currentContact?.address ||
      currentContact.address === currentAccount.address ||
      paymentAmount?.integerBalance <= 0 ||
      !hasSufficientBalance ||
      !!submitData ||
      !!submitError ||
      submitLoading
    )
  }, [
    paymentAmount,
    currentAccount,
    currentContact,
    memoValid,
    accountData,
    submitData,
    submitError,
    submitLoading,
  ])

  const handleShowPaymentKeyboard = useCallback(() => {
    Keyboard.dismiss()
    showHNTKeyboard({
      payee: currentContact,
      payer: currentAccount,
      containerHeight,
    })
  }, [containerHeight, currentAccount, currentContact, showHNTKeyboard])

  const handleContainerLayout = useCallback(
    (layout: LayoutChangeEvent) =>
      setContainerHeight(layout.nativeEvent.layout.height),
    [],
  )

  return (
    <TouchableWithoutFeedbackBox flex={1} onPress={Keyboard.dismiss}>
      <SafeAreaBox
        backgroundColor="primaryBackground"
        flex={1}
        edges={edges}
        onLayout={handleContainerLayout}
      >
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          marginBottom="xxl"
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

        <AccountButton
          title={currentAccount?.alias}
          subtitle={balanceToString(balances?.hnt, { maxDecimalPlaces: 2 })}
          address={currentAccount?.address}
          onPress={showAccountSelector}
          showBubbleArrow
          marginHorizontal="l"
          isTestnet={currentAccount?.netType === NetType.TESTNET}
        />

        <AccountButton
          marginTop="l"
          title={
            currentContact ? currentContact.alias : t('payment.selectContact')
          }
          subtitle={
            currentContact
              ? ellipsizeAddress(currentContact.address)
              : undefined
          }
          address={currentContact?.address || EMPTY_B58_ADDRESS.b58}
          onPress={showAddressBook}
          marginHorizontal="l"
          isTestnet={currentContact?.netType === NetType.TESTNET}
        />

        <Box
          minHeight={148}
          backgroundColor="surfaceSecondary"
          margin="l"
          borderRadius="xl"
        >
          <TouchableOpacityBox
            flex={1}
            justifyContent="center"
            onPress={handleShowPaymentKeyboard}
          >
            {!tokenValue || tokenValue === '0' ? (
              <Text
                paddingHorizontal="m"
                variant="subtitle2"
                style={colorStyle}
              >
                {t('payment.enterAmount', {
                  ticker: paymentAmount?.type.ticker,
                })}
              </Text>
            ) : (
              <>
                <Text
                  paddingHorizontal="m"
                  variant="subtitle2"
                  color="primaryText"
                >
                  {balanceToString(paymentAmount)}
                </Text>
                <Text paddingHorizontal="m" variant="body3" style={colorStyle}>
                  {t('payment.fee', {
                    value: balanceToString(feeAsTokens, {
                      maxDecimalPlaces: 4,
                    }),
                  })}
                </Text>
              </>
            )}
          </TouchableOpacityBox>
          <Box height={1} backgroundColor="primaryBackground" />
          <MemoInput value={txnMemo} onChangeText={setTxnMemo} />
        </Box>
        <Box
          flex={1}
          justifyContent="flex-end"
          marginHorizontal="l"
          position="relative"
        >
          <Box height={64}>
            <SubmitButton
              title={t('payment.sendButton', {
                ticker: paymentAmount?.type.ticker,
              })}
              onSubmit={handleSubmit}
              disabled={isFormInvalid}
            />
            {submitLoading && (
              <Box
                position="absolute"
                top={0}
                bottom={0}
                justifyContent="center"
                marginLeft="lm"
              >
                <ActivityIndicator color={primaryText} />
              </Box>
            )}
          </Box>
        </Box>
      </SafeAreaBox>
    </TouchableWithoutFeedbackBox>
  )
}

export default withHNTKeyboardProvider(
  withAddressBookProvider(memo(PaymentScreen)),
)
