import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import Balance, { DataCredits } from '@helium/currency'
import { useTranslation } from 'react-i18next'
import { differenceInMilliseconds } from 'date-fns'
import PaymentArrow from '@assets/images/paymentArrow.svg'
import { LayoutChangeEvent } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useOpacity } from '../theme/themeHooks'
import Keypad from './Keypad'
import Box from './Box'
import Text from './Text'
import {
  EMPTY_B58_ADDRESS,
  useTransactions,
} from '../storage/TransactionProvider'
import {
  balanceToString,
  ORACLE_POLL_INTERVAL,
  useBalance,
} from '../utils/Balance'
import TouchableOpacityBox from './TouchableOpacityBox'
import SafeAreaBox from './SafeAreaBox'
import AccountIcon from './AccountIcon'
import { CSAccount } from '../storage/AccountStorageProvider'
import { KeypadInput } from './KeypadButton'
import { decimalSeparator, groupSeparator, locale } from '../utils/i18n'

const initialState = {
  show: () => undefined,
  hide: () => undefined,
  value: '',
}
type HNTKeyboardSelectorActions = {
  show: (opts: {
    payer?: CSAccount | null
    payee?: CSAccount | null
    containerHeight?: number
  }) => void
  hide: () => void
  value: string
}
const HNTKeyboardSelectorContext =
  createContext<HNTKeyboardSelectorActions>(initialState)
const { Provider } = HNTKeyboardSelectorContext

const HNTKeyboardSelector = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
  const { backgroundStyle: cancelBackgroundStyle } = useOpacity('error', 0.4)
  const [value, setValue] = useState('0')
  const [originalValue, setOriginalValue] = useState('')
  const [fee, setFee] = useState<Balance<DataCredits>>()
  const [payee, setPayee] = useState<CSAccount | null | undefined>()
  const [payer, setPayer] = useState<CSAccount | null | undefined>()
  const [containerHeight, setContainerHeight] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)
  const { calculatePaymentTxnFee } = useTransactions()
  const { dcToTokens, oracleDateTime, floatToBalance, accountBalance } =
    useBalance()
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

  const valueAsBalance = useMemo(() => {
    const numberVal = parseFloat(value)
    return floatToBalance(numberVal)
  }, [floatToBalance, value])

  const currentAccountBalance = useMemo(
    () => accountBalance(),
    [accountBalance],
  )

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToTokens(fee)
  }, [dcToTokens, fee])

  useEffect(() => {
    if (!currentAccountBalance) return

    calculatePaymentTxnFee([
      {
        address: EMPTY_B58_ADDRESS.b58,
        balanceAmount: currentAccountBalance,
        memo: '',
      },
    ]).then(setFee)
  }, [calculatePaymentTxnFee, value, currentAccountBalance])

  const show = useCallback(
    (opts: {
      payer?: CSAccount | null
      payee?: CSAccount | null
      containerHeight?: number
    }) => {
      setPayer(opts.payer)
      setPayee(opts.payee)
      setContainerHeight(opts.containerHeight || 0)
      bottomSheetModalRef.current?.present()
    },
    [],
  )

  const hide = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])

  const handleSetMax = useCallback(() => {
    if (!currentAccountBalance || !feeAsTokens) return

    const val = currentAccountBalance
      .minus(feeAsTokens)
      .floatBalance.toLocaleString(locale, { maximumFractionDigits: 10 })
      .replaceAll(groupSeparator, '')

    setValue(val)
  }, [currentAccountBalance, feeAsTokens])

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
        <Box backgroundColor="primaryBackground" flex={1}>
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
              <AccountIcon size={40} address={payer?.address} />
              <Box padding="s">
                <PaymentArrow />
              </Box>
              <AccountIcon
                size={40}
                address={payee?.address || EMPTY_B58_ADDRESS.b58}
              />
            </Box>
            <Text
              variant="body2"
              marginTop="lm"
              marginBottom={{ smallPhone: 'none', phone: 'lm' }}
            >
              {t('hntKeyboard.hntAvailable', {
                amount: balanceToString(currentAccountBalance, {
                  maxDecimalPlaces: 4,
                }),
              })}
            </Text>
          </Box>
        </Box>
      </BottomSheetBackdrop>
    ),
    [
      currentAccountBalance,
      handleHeaderLayout,
      payee,
      payer,
      t,
      valueAsBalance,
    ],
  )

  const renderHandle = useCallback(() => {
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
  }, [handleSetMax, t, timeStr])

  const hasSufficientBalance = useMemo(() => {
    if (!feeAsTokens || !valueAsBalance || !currentAccountBalance) return

    return (
      (currentAccountBalance?.minus(feeAsTokens).minus(valueAsBalance))
        .integerBalance >= 0
    )
  }, [currentAccountBalance, feeAsTokens, valueAsBalance])

  const handleConfirm = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])

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
    (index: number) => {
      if (index < 0) return

      setOriginalValue(value)
    },
    [value],
  )

  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

  return (
    <BottomSheetModalProvider>
      <Provider value={{ hide, show, value }}>
        <BottomSheetModal
          onChange={handleChange}
          ref={bottomSheetModalRef}
          index={0}
          backgroundStyle={backgroundStyle}
          backdropComponent={renderBackdrop}
          handleComponent={renderHandle}
          snapPoints={snapPoints}
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
            <Text
              paddingHorizontal="m"
              maxFontSizeMultiplier={1}
              numberOfLines={1}
              variant="body1"
              color="secondaryText"
              marginBottom="l"
            >
              {t('hntKeyboard.fee', {
                value: balanceToString(feeAsTokens, { maxDecimalPlaces: 4 }),
              })}
            </Text>
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
                style={cancelBackgroundStyle}
              >
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
      </Provider>
    </BottomSheetModalProvider>
  )
}

export const useHNTKeyboardSelector = () =>
  useContext(HNTKeyboardSelectorContext)

export const withHNTKeyboardProvider = (Component: FC) => () =>
  (
    <HNTKeyboardSelector>
      <Component />
    </HNTKeyboardSelector>
  )
