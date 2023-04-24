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
  CurrencyType,
  NetworkTokens,
  SolTokens,
  TestNetworkTokens,
  Ticker,
} from '@helium/currency'
import { useTranslation } from 'react-i18next'
import PaymentArrow from '@assets/images/paymentArrow.svg'
import { LayoutChangeEvent } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { BoxProps } from '@shopify/restyle'
import { floor } from 'lodash'
import { differenceInMilliseconds } from 'date-fns'
import { Portal } from '@gorhom/portal'
import { useOpacity, useSafeTopPaddingStyle } from '@theme/themeHooks'
import { Theme } from '@theme/theme'
import useBackHandler from '@hooks/useBackHandler'
import Keypad from './Keypad'
import Box from './Box'
import Text from './Text'
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
import { CSAccount } from '../storage/cloudStorage'
import { Payment } from '../features/payment/PaymentItem'
import { useAppStorage } from '../storage/AppStorageProvider'

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
  ticker: Ticker
  networkFee?: Balance<NetworkTokens | TestNetworkTokens | SolTokens>
  children: ReactNode
  handleVisible?: (visible: boolean) => void
  onConfirmBalance: (opts: {
    balance: Balance<TestNetworkTokens | NetworkTokens>
    payee?: string
    index?: number
  }) => void
  usePortal?: boolean
} & BoxProps<Theme>
const HNTKeyboardSelector = forwardRef(
  (
    {
      children,
      onConfirmBalance,
      handleVisible,
      ticker,
      networkFee,
      usePortal = false,
      ...boxProps
    }: Props,
    ref: Ref<HNTKeyboardRef>,
  ) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const [value, setValue] = useState('0')
    const [originalValue, setOriginalValue] = useState('')
    const [payee, setPayee] = useState<CSAccount | string | null | undefined>()
    const [payments, setPayments] = useState<Payment[]>()
    const [payer, setPayer] = useState<CSAccount | null | undefined>()
    const [paymentIndex, setPaymentIndex] = useState<number>()
    const [containerHeight, setContainerHeight] = useState(0)
    const [headerHeight, setHeaderHeight] = useState(0)
    const containerStyle = useSafeTopPaddingStyle('android')
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const { l1Network } = useAppStorage()

    const {
      oracleDateTime,
      floatToBalance,
      hntBalance: networkBalance,
      mobileBalance,
      iotBalance,
      dcBalance,
      bonesToBalance,
      solBalance,
    } = useBalance()
    const [timeStr, setTimeStr] = useState('')

    const getHeliumBalance = useMemo(() => {
      switch (ticker) {
        case 'SOL':
          return solBalance
        case 'MOBILE':
          return mobileBalance
        case 'IOT':
          return iotBalance
        case 'DC':
          return dcBalance
        default:
          return networkBalance
      }
    }, [
      dcBalance,
      iotBalance,
      mobileBalance,
      networkBalance,
      ticker,
      solBalance,
    ])

    const isDntToken = useMemo(() => {
      return l1Network === 'solana' && (ticker === 'IOT' || ticker === 'MOBILE')
    }, [l1Network, ticker])

    const balanceForTicker = useMemo(
      () => (ticker === 'HNT' ? networkBalance : getHeliumBalance),
      [getHeliumBalance, networkBalance, ticker],
    )

    const snapPoints = useMemo(() => {
      const sheetHeight = containerHeight - headerHeight
      return [sheetHeight > 0 ? sheetHeight : 600]
    }, [containerHeight, headerHeight])

    useEffect(() => {
      if (l1Network === 'solana') return
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

      if (ticker === 'DC') {
        return new Balance(numberVal, CurrencyType.dataCredit)
      }

      return floatToBalance(numberVal, ticker)
    }, [floatToBalance, ticker, value])

    const hasMaxDecimals = useMemo(() => {
      if (!valueAsBalance) return false
      const valueString = value
        .replaceAll(groupSeparator, '')
        .replaceAll(decimalSeparator, '.')
      if (!valueString.includes('.')) return false

      const [, decimals] = valueString.split('.')
      return (
        decimals.length >=
        (isDntToken ? 6 : valueAsBalance?.type.decimalPlaces.toNumber())
      )
    }, [value, valueAsBalance, isDntToken])

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

    const handleHeaderLayout = useCallback(
      (layout: LayoutChangeEvent) =>
        setHeaderHeight(layout.nativeEvent.layout.height),
      [],
    )

    const [maxEnabled, setMaxEnabled] = useState(false)

    const handleSetMax = useCallback(() => {
      if (!networkBalance || !getHeliumBalance || !networkFee) return

      const currentAmount = getNextPayments()
        .filter((_v, index) => index !== paymentIndex || 0) // Remove the payment being updated
        .reduce(
          (prev, current) => {
            if (!current.amount) {
              return prev
            }
            return prev.plus(current.amount)
          },
          ticker === 'DC'
            ? new Balance(0, CurrencyType.dataCredit)
            : bonesToBalance(0, ticker),
        )

      let maxBalance: Balance<NetworkTokens | TestNetworkTokens> | undefined
      if (ticker === 'HNT') {
        maxBalance = networkBalance.minus(currentAmount)
        if (l1Network === 'helium') {
          maxBalance = maxBalance.minus(networkFee)
        }
      } else {
        maxBalance = getHeliumBalance.minus(currentAmount)
      }

      if (maxBalance.integerBalance < 0 && ticker !== 'DC') {
        maxBalance = bonesToBalance(0, ticker)
      }

      const decimalPlaces = isDntToken
        ? 6
        : maxBalance.type.decimalPlaces.toNumber()

      const val = floor(maxBalance.floatBalance, decimalPlaces)
        .toLocaleString(locale, {
          maximumFractionDigits: decimalPlaces,
        })
        .replaceAll(groupSeparator, '')

      setValue(maxEnabled ? '0' : val)
      setMaxEnabled((m) => !m)
    }, [
      isDntToken,
      networkBalance,
      getHeliumBalance,
      networkFee,
      getNextPayments,
      bonesToBalance,
      ticker,
      maxEnabled,
      paymentIndex,
      l1Network,
    ])

    const BackdropWrapper = useCallback(
      ({ children: backdropChildren }: { children: ReactNode }) => {
        if (!usePortal) {
          return (
            <Box flex={1} style={containerStyle}>
              {backdropChildren}
            </Box>
          )
        }

        return (
          <SafeAreaBox edges={['top']} flex={1} style={containerStyle}>
            {backdropChildren}
          </SafeAreaBox>
        )
      },
      [containerStyle, usePortal],
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
          <BackdropWrapper>
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
                    <AccountIcon
                      size={40}
                      address={payer?.address || payer?.solanaAddress}
                    />

                    <Box padding="s">
                      <PaymentArrow />
                    </Box>
                  </>
                )}
                {payeeAddress && (
                  <AccountIcon size={40} address={payeeAddress || '1'} />
                )}
              </Box>
              <Text
                variant="body2"
                marginTop="lm"
                marginBottom={{ smallPhone: 'none', phone: 'lm' }}
              >
                {payer
                  ? t('hntKeyboard.hntAvailable', {
                      amount: balanceToString(balanceForTicker, {
                        maxDecimalPlaces: 4,
                      }),
                    })
                  : ''}
              </Text>
            </Box>
          </BackdropWrapper>
        </BottomSheetBackdrop>
      ),
      [
        balanceForTicker,
        handleHeaderLayout,
        payeeAddress,
        payer,
        t,
        valueAsBalance,
        BackdropWrapper,
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
              marginBottom="s"
              onPress={handleSetMax}
              backgroundColor={maxEnabled ? 'white' : 'transparent'}
              borderColor={maxEnabled ? 'transparent' : 'surface'}
              borderWidth={1.5}
              borderRadius="m"
              paddingVertical="xs"
              paddingHorizontal="ms"
            >
              <Text
                variant="subtitle3"
                textAlign="center"
                alignSelf="flex-end"
                color={maxEnabled ? 'black900' : 'secondaryText'}
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
    }, [handleSetMax, maxEnabled, payer, t, timeStr])

    const hasSufficientBalance = useMemo(() => {
      if (!payer) return true

      if (
        !networkFee ||
        !valueAsBalance ||
        !networkBalance ||
        !getHeliumBalance
      ) {
        return false
      }

      if (l1Network === 'solana') {
        if (ticker !== 'HNT') {
          return getHeliumBalance.minus(valueAsBalance).integerBalance >= 0
        }
        return networkBalance.minus(valueAsBalance).integerBalance >= 0
      }

      if (ticker === 'MOBILE') {
        // If paying with mobile on helium L1, they need to have enough mobile to cover the payment
        // and enough hnt to cover the fee
        const hasEnoughHnt =
          networkBalance.minus(networkFee).integerBalance >= 0
        const hasEnoughMobile =
          getHeliumBalance.minus(valueAsBalance).integerBalance >= 0
        return hasEnoughHnt && hasEnoughMobile
      }
      return (
        networkBalance.minus(networkFee).minus(valueAsBalance).integerBalance >=
        0
      )
    }, [
      getHeliumBalance,
      l1Network,
      networkBalance,
      networkFee,
      payer,
      ticker,
      valueAsBalance,
    ])

    const handleConfirm = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()

      if (!valueAsBalance) return

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

    const handleNumber = useCallback(
      (nextDigit: number) => {
        if (hasMaxDecimals) return
        setValue((prevVal) => {
          if (prevVal !== '0') {
            return `${prevVal}${nextDigit}`
          }
          return nextDigit.toString()
        })
      },
      [hasMaxDecimals],
    )

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

    const PortalWrapper = useCallback(
      ({ children: portalChildren }: { children: ReactNode }) => {
        if (usePortal) {
          return <Portal>{portalChildren}</Portal>
        }
        return <>{portalChildren}</>
      },
      [usePortal],
    )

    return (
      <Box flex={1} {...boxProps}>
        <PortalWrapper>
          <BottomSheetModalProvider>
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
                {payer && networkFee && (
                  <Text
                    paddingHorizontal="m"
                    maxFontSizeMultiplier={1}
                    numberOfLines={1}
                    variant="body1"
                    color="secondaryText"
                    marginBottom="l"
                  >
                    {t('hntKeyboard.fee', {
                      value: balanceToString(networkFee, {
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
                <Box
                  flexDirection="row"
                  marginHorizontal="l"
                  marginVertical="l"
                >
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
                    backgroundColor={
                      hasSufficientBalance ? 'surface' : 'grey300'
                    }
                    disabled={!hasSufficientBalance}
                  >
                    <Text variant="subtitle2">{t('generic.confirm')}</Text>
                  </TouchableOpacityBox>
                </Box>
              </SafeAreaBox>
            </BottomSheetModal>
            {!usePortal && children}
          </BottomSheetModalProvider>
        </PortalWrapper>
        {usePortal && children}
      </Box>
    )
  },
)

export default memo(HNTKeyboardSelector)
