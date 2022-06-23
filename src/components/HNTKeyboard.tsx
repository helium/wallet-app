/* eslint-disable react/jsx-props-no-spreading */
import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import Balance, {
  DataCredits,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { useTranslation } from 'react-i18next'
import { differenceInMilliseconds } from 'date-fns'
import PaymentArrow from '@assets/images/paymentArrow.svg'
import { LayoutChangeEvent } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { BoxProps } from '@shopify/restyle'
import { floor } from 'lodash'
import { useOpacity, useSafeTopPaddingStyle } from '../theme/themeHooks'
import Keypad from './Keypad'
import Box from './Box'
import Text from './Text'
import { useTransactions } from '../storage/TransactionProvider'
import {
  balanceToString,
  ORACLE_POLL_INTERVAL,
  useBalance,
} from '../utils/Balance'
import TouchableOpacityBox from './TouchableOpacityBox'
import SafeAreaBox from './SafeAreaBox'
import AccountIcon from './AccountIcon'
import { KeypadInput } from './KeypadButton'
import { decimalSeparator, groupSeparator, locale } from '../utils/i18n'
import BackgroundFill from './BackgroundFill'
import HandleBasic from './HandleBasic'
import { Theme } from '../theme/theme'
import { Payment } from '../features/payment/PaymentItem'
import { CSAccount } from '../storage/cloudStorage'
import useBackHandler from '../utils/useBackHandler'

type ShowOptions = {
  payer?: CSAccount | null
  payee?: CSAccount | string | null
  containerHeight?: number
  balance?: Balance<TestNetworkTokens | NetworkTokens>
  index?: number
  payments?: Payment[]
}

export type HNTKeyboardRef = {
  show: (opts: ShowOptions) => void
  hide: () => void
}

type Props = {
  children: ReactNode
  handleVisible?: (visible: boolean) => void
  onConfirmBalance: (opts: {
    balance: Balance<TestNetworkTokens | NetworkTokens>
    payee: string
    index?: number
  }) => void
} & BoxProps<Theme>
const HNTKeyboardSelector = forwardRef(
  (
    { children, onConfirmBalance, handleVisible, ...boxProps }: Props,
    ref: Ref<HNTKeyboardRef>,
  ) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const [value, setValue] = useState('0')
    const [originalValue, setOriginalValue] = useState('')
    const [fee, setFee] = useState<Balance<DataCredits>>()
    const [payee, setPayee] = useState<CSAccount | string | null | undefined>()
    const [payer, setPayer] = useState<CSAccount | null | undefined>()
    const [payments, setPayments] = useState<Payment[]>()
    const [paymentIndex, setPaymentIndex] = useState<number>()
    const [containerHeight, setContainerHeight] = useState(0)
    const [headerHeight, setHeaderHeight] = useState(0)
    const containerStyle = useSafeTopPaddingStyle('android')
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)

    const { calculatePaymentTxnFee } = useTransactions()
    const {
      dcToTokens,
      oracleDateTime,
      floatToBalance,
      accountBalance,
      zeroBalanceNetworkToken,
    } = useBalance()
    const [timeStr, setTimeStr] = useState('')

    const snapPoints = useMemo(() => {
      const sheetHeight = containerHeight - headerHeight
      return [sheetHeight > 0 ? sheetHeight : 600]
    }, [containerHeight, headerHeight])

    useEffect(() => {
      const timer = setTimeout(() => {
        if (!oracleDateTime) return '???'

        const msDiff = differenceInMilliseconds(new Date(), oracleDateTime)
        const timeRemaining = ORACLE_POLL_INTERVAL - msDiff
        const time = new Date(timeRemaining).toISOString().substring(14, 19)
        setTimeStr(t('hntKeyboard.validFor', { time }))
      }, 1000)

      return () => clearTimeout(timer)
    })

    const payeeAddress = useMemo(() => {
      if (payee && typeof payee === 'string') {
        return payee
      }
      if ((payee as CSAccount)?.address) {
        return (payee as CSAccount).address
      }
    }, [payee])

    const valueAsBalance = useMemo(() => {
      const stripped = value
        .replaceAll(groupSeparator, '')
        .replaceAll(decimalSeparator, '.')
      const numberVal = parseFloat(stripped)
      return floatToBalance(numberVal)
    }, [floatToBalance, value])

    const feeAsTokens = useMemo(() => {
      if (!fee) return

      return dcToTokens(fee)
    }, [dcToTokens, fee])

    const getNextPayments = useCallback(() => {
      if (payments && paymentIndex !== undefined) {
        return payments.map((p, mapIndex) => {
          if (mapIndex !== paymentIndex) {
            return p
          }
          return { ...p, amount: valueAsBalance }
        })
      }
      return [{ amount: valueAsBalance, address: payeeAddress }]
    }, [payeeAddress, paymentIndex, payments, valueAsBalance])

    useEffect(() => {
      const nextPayments = getNextPayments()
      const mapped = nextPayments.map((p) => ({
        payee: p.address || '',
        balanceAmount: p.amount || zeroBalanceNetworkToken,
        memo: '',
      }))
      calculatePaymentTxnFee(mapped).then(setFee)
    }, [
      calculatePaymentTxnFee,
      value,
      accountBalance,
      payer,
      getNextPayments,
      zeroBalanceNetworkToken,
    ])

    const show = useCallback(
      (opts: ShowOptions) => {
        handleVisible?.(true)

        setPayer(opts.payer)
        setPayee(opts.payee)
        setPaymentIndex(opts.index)
        setPayments(opts.payments)
        setContainerHeight(opts.containerHeight || 0)

        const val = opts.balance?.floatBalance
          .toLocaleString(locale, { maximumFractionDigits: 10 })
          .replaceAll(groupSeparator, '')
        setValue(val || '0')

        bottomSheetModalRef.current?.present()
        setIsShowing(true)
      },
      [handleVisible, setIsShowing],
    )

    const hide = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()
    }, [])

    const handleSetMax = useCallback(() => {
      if (!accountBalance || !feeAsTokens) return

      const currentAmount = getNextPayments()
        .filter((_v, index) => index !== paymentIndex || 0) // Remove the payment being updated
        .reduce((prev, current) => {
          if (!current.amount) {
            return prev
          }
          return prev.plus(current.amount)
        }, zeroBalanceNetworkToken)

      let maxBalance = accountBalance.minus(currentAmount).minus(feeAsTokens)

      if (maxBalance.integerBalance < 0) {
        maxBalance = zeroBalanceNetworkToken
      }

      const decimalPlaces = maxBalance.type.decimalPlaces.toNumber()

      const val = floor(maxBalance.floatBalance, decimalPlaces)
        .toLocaleString(locale, {
          maximumFractionDigits: decimalPlaces,
        })
        .replaceAll(groupSeparator, '')

      setValue(val)
    }, [
      accountBalance,
      feeAsTokens,
      getNextPayments,
      paymentIndex,
      zeroBalanceNetworkToken,
    ])

    const handleHeaderLayout = useCallback(
      (layout: LayoutChangeEvent) =>
        setHeaderHeight(layout.nativeEvent.layout.height),
      [],
    )

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          opacity={1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        >
          <Box
            backgroundColor="primaryBackground"
            flex={1}
            style={containerStyle}
          >
            <Box padding="l" alignItems="center" onLayout={handleHeaderLayout}>
              <Text variant="subtitle2">
                {t('hntKeyboard.enterAmount', {
                  ticker: valueAsBalance?.type.ticker,
                })}
              </Text>
              <Box
                flexDirection="row"
                alignItems="center"
                marginTop={{ smallPhone: 'm', phone: 'xxl' }}
              >
                {payer && (
                  <>
                    <AccountIcon size={40} address={payer?.address} />

                    <Box padding="s">
                      <PaymentArrow />
                    </Box>
                  </>
                )}
                <AccountIcon size={40} address={payeeAddress} />
              </Box>
              <Text
                variant="body2"
                marginTop="lm"
                marginBottom={{ smallPhone: 'none', phone: 'lm' }}
              >
                {payer
                  ? t('hntKeyboard.hntAvailable', {
                      amount: balanceToString(accountBalance, {
                        maxDecimalPlaces: 4,
                      }),
                    })
                  : ''}
              </Text>
            </Box>
          </Box>
        </BottomSheetBackdrop>
      ),
      [
        containerStyle,
        accountBalance,
        handleHeaderLayout,
        payeeAddress,
        payer,
        t,
        valueAsBalance,
      ],
    )

    const renderHandle = useCallback(() => {
      if (!payer) {
        return <HandleBasic marginTop="s" marginBottom="m" />
      }
      return (
        <Box flexDirection="row" margin="m" marginBottom="none">
          <Box flex={1} />
          <Box
            width={58}
            height={5}
            backgroundColor="black500"
            borderRadius="round"
          />
          <Box flex={1} alignItems="flex-end">
            <TouchableOpacityBox
              backgroundColor="error"
              marginBottom="s"
              onPress={handleSetMax}
              borderRadius="round"
            >
              <Text
                variant="subtitle3"
                minWidth={58}
                color="surfaceSecondary"
                textAlign="center"
                alignSelf="flex-end"
              >
                {t('payment.max')}
              </Text>
            </TouchableOpacityBox>
            <Text
              variant="subtitle4"
              color="secondaryText"
              maxFontSizeMultiplier={1}
              numberOfLines={1}
              alignSelf="flex-end"
              adjustsFontSizeToFit
            >
              {timeStr}
            </Text>
          </Box>
        </Box>
      )
    }, [handleSetMax, payer, t, timeStr])

    const hasSufficientBalance = useMemo(() => {
      if (!payer) return true

      if (!feeAsTokens || !valueAsBalance || !accountBalance) {
        return false
      }
      return (
        (accountBalance?.minus(feeAsTokens).minus(valueAsBalance))
          .integerBalance >= 0
      )
    }, [accountBalance, feeAsTokens, payer, valueAsBalance])

    const handleConfirm = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()

      if (!payeeAddress || !valueAsBalance) return

      onConfirmBalance({
        balance: valueAsBalance,
        payee: payeeAddress,
        index: paymentIndex,
      })
      bottomSheetModalRef.current?.dismiss()
    }, [payeeAddress, valueAsBalance, onConfirmBalance, paymentIndex])

    const handleCancel = useCallback(() => {
      setValue(originalValue)
      bottomSheetModalRef.current?.dismiss()
    }, [originalValue])

    const handleDecimal = useCallback(() => {
      setValue((prevVal) => {
        if (prevVal.includes(decimalSeparator)) return prevVal
        return prevVal + decimalSeparator
      })
    }, [])

    const handleBackspace = useCallback(() => {
      setValue((prevVal) => prevVal.substring(0, prevVal.length - 1) || '0')
    }, [])

    const handleNumber = useCallback((nextDigit: number) => {
      setValue((prevVal) => {
        if (prevVal !== '0') {
          return `${prevVal}${nextDigit}`
        }
        return nextDigit.toString()
      })
    }, [])

    const handlePress = useCallback(
      (input?: KeypadInput) => {
        if (typeof input === 'number') {
          handleNumber(input)
        } else if (input === 'backspace') {
          handleBackspace()
        } else {
          handleDecimal()
        }
      },
      [handleBackspace, handleDecimal, handleNumber],
    )

    const handleChange = useCallback(
      (idx: number) => {
        if (idx < 0) return

        setOriginalValue(value)
      },
      [value],
    )

    const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

    const handleModalDismiss = useCallback(() => {
      handleDismiss()
      handleVisible?.(false)
    }, [handleDismiss, handleVisible])

    return (
      <BottomSheetModalProvider>
        <Box flex={1} {...boxProps}>
          <BottomSheetModal
            onChange={handleChange}
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            handleComponent={renderHandle}
            snapPoints={snapPoints}
            onDismiss={handleModalDismiss}
          >
            <SafeAreaBox
              flex={1}
              edges={safeEdges}
              flexDirection="column"
              alignItems="center"
            >
              <Text
                marginHorizontal="l"
                variant="h1"
                maxFontSizeMultiplier={1}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {`${value || '0'} ${valueAsBalance?.type.ticker}`}
              </Text>
              {payer && (
                <Text
                  paddingHorizontal="m"
                  maxFontSizeMultiplier={1}
                  numberOfLines={1}
                  variant="body1"
                  color="secondaryText"
                  marginBottom="l"
                >
                  {t('hntKeyboard.fee', {
                    value: balanceToString(feeAsTokens, {
                      maxDecimalPlaces: 4,
                    }),
                  })}
                </Text>
              )}
              <Keypad
                customButtonType="decimal"
                onPress={handlePress}
                marginHorizontal="l"
                flex={1}
              />
              <Box flexDirection="row" marginHorizontal="l" marginVertical="l">
                <TouchableOpacityBox
                  minHeight={66}
                  onPress={handleCancel}
                  borderRadius="round"
                  alignItems="center"
                  justifyContent="center"
                  flex={1}
                  marginRight="xs"
                  overflow="hidden"
                >
                  <BackgroundFill backgroundColor="error" />
                  <Text variant="subtitle2" color="error">
                    {t('generic.cancel')}
                  </Text>
                </TouchableOpacityBox>
                <TouchableOpacityBox
                  onPress={handleConfirm}
                  marginLeft="xs"
                  minHeight={66}
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="round"
                  flex={1}
                  backgroundColor={hasSufficientBalance ? 'surface' : 'grey300'}
                  disabled={!hasSufficientBalance}
                >
                  <Text variant="subtitle2">{t('generic.confirm')}</Text>
                </TouchableOpacityBox>
              </Box>
            </SafeAreaBox>
          </BottomSheetModal>
          {children}
        </Box>
      </BottomSheetModalProvider>
    )
  },
)

export default memo(HNTKeyboardSelector)
