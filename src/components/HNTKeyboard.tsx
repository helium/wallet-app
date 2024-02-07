import PaymentArrow from '@assets/images/paymentArrow.svg'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { Portal } from '@gorhom/portal'
import {
  useMint,
  useOwnedAmount,
  useSolOwnedAmount,
} from '@helium/helium-react-hooks'
import useBackHandler from '@hooks/useBackHandler'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import { useOpacity, useSafeTopPaddingStyle } from '@theme/themeHooks'
import BN from 'bn.js'
import React, {
  ReactNode,
  Ref,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { Payment } from '../features/payment/PaymentItem'
import { CSAccount } from '../storage/cloudStorage'
import { decimalSeparator, groupSeparator } from '../utils/i18n'
import { humanReadable } from '../utils/solanaUtils'
import AccountIcon from './AccountIcon'
import BackgroundFill from './BackgroundFill'
import Box from './Box'
import HandleBasic from './HandleBasic'
import Keypad from './Keypad'
import { KeypadInput } from './KeypadButton'
import SafeAreaBox from './SafeAreaBox'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'

type ShowOptions = {
  payer?: CSAccount | null
  payee?: CSAccount | string | null
  containerHeight?: number
  balance?: BN
  index?: number
  payments?: Payment[]
}

export type HNTKeyboardRef = {
  show: (opts: ShowOptions) => void
  hide: () => void
}

type Props = {
  mint?: PublicKey
  networkFee?: BN
  // Ensure a minimum number of tokens, useful for swapping sol
  minTokens?: BN
  children: ReactNode
  handleVisible?: (visible: boolean) => void
  onConfirmBalance: (opts: {
    balance: BN
    max: boolean
    payee?: string
    index?: number
  }) => void
  usePortal?: boolean
  allowOverdraft?: boolean
  // allow this keyboard to be used with BN values of a mint other
  // than just owned amount
  actionableAmount?: BN
} & BoxProps<Theme>
const HNTKeyboardSelector = forwardRef(
  (
    {
      minTokens,
      children,
      onConfirmBalance,
      handleVisible,
      mint,
      networkFee,
      usePortal = false,
      allowOverdraft = false,
      actionableAmount,
      ...boxProps
    }: Props,
    ref: Ref<HNTKeyboardRef>,
  ) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const decimals = useMint(mint)?.info?.decimals
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { symbol, loading: loadingMeta } = useMetaplexMetadata(mint)
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
    const wallet = useCurrentWallet()

    const { amount: balanceForMintToken } = useOwnedAmount(wallet, mint)
    const { amount: solBalance } = useSolOwnedAmount(wallet)
    const balanceForMint = useMemo(
      () =>
        actionableAmount ||
        (mint?.equals(NATIVE_MINT) ? solBalance : balanceForMintToken),
      [mint, solBalance, balanceForMintToken, actionableAmount],
    )

    const snapPoints = useMemo(() => {
      const sheetHeight = containerHeight - headerHeight
      return [sheetHeight > 0 ? sheetHeight : 600]
    }, [containerHeight, headerHeight])

    const payeeAddress = useMemo(() => {
      if (payee && typeof payee === 'string') {
        return payee
      }
      if ((payee as CSAccount)?.address) {
        return (payee as CSAccount).address
      }
    }, [payee])

    const valueAsBalance = useMemo(() => {
      if (!value || typeof decimals === 'undefined') return undefined
      const [whole, dec] = value.split(decimalSeparator)
      const decPart = (dec || '').padEnd(decimals, '0').slice(0, decimals)
      const fullStr = `${whole.replaceAll(groupSeparator, '')}${decPart}`

      return new BN(fullStr)
    }, [value, decimals])

    const hasMaxDecimals = useMemo(() => {
      if (!valueAsBalance || typeof decimals === 'undefined') return false
      const valueString = value
        .replaceAll(groupSeparator, '')
        .replaceAll(decimalSeparator, '.')
      if (!valueString.includes('.')) return false

      const [, dec] = valueString.split('.')
      return dec.length >= decimals
    }, [value, valueAsBalance, decimals])

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

        const val =
          opts.balance && typeof decimals !== 'undefined'
            ? humanReadable(opts.balance, decimals)
            : undefined
        setValue(val || '0')

        bottomSheetModalRef.current?.present()
        setIsShowing(true)
      },
      [handleVisible, setIsShowing, decimals],
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
      if (!valueAsBalance || !networkFee) return

      const currentAmount = getNextPayments()
        .filter((_v, index) => index !== (paymentIndex || 0)) // Remove the payment being updated
        .reduce((prev, current) => {
          if (!current.amount) {
            return prev
          }
          return prev.add(current.amount)
        }, new BN(0))

      let maxBalance: BN | undefined = balanceForMint
        ? new BN(balanceForMint.toString()).sub(currentAmount)
        : undefined

      if (minTokens && maxBalance) {
        maxBalance = maxBalance.sub(minTokens)
      }

      if (mint?.equals(NATIVE_MINT)) {
        maxBalance = networkFee ? maxBalance?.sub(networkFee) : maxBalance
      }

      if (maxBalance?.lt(new BN(0))) {
        maxBalance = new BN(0)
      }

      const val = humanReadable(maxBalance, decimals) || '0'

      setValue(maxEnabled ? '0' : val)
      setMaxEnabled((m) => !m)
    }, [
      valueAsBalance,
      minTokens,
      networkFee,
      getNextPayments,
      balanceForMint,
      mint,
      decimals,
      maxEnabled,
      paymentIndex,
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
              {!loadingMeta && (
                <Text variant="subtitle2">
                  {t('hntKeyboard.enterAmount', {
                    ticker: symbol || '',
                  })}
                </Text>
              )}
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
                {payer && balanceForMint && typeof decimals !== 'undefined'
                  ? t('hntKeyboard.hntAvailable', {
                      amount:
                        typeof decimals !== 'undefined' &&
                        humanReadable(
                          new BN(balanceForMint.toString()),
                          decimals,
                        ),
                    })
                  : ''}
              </Text>
            </Box>
          </BackdropWrapper>
        </BottomSheetBackdrop>
      ),
      [
        BackdropWrapper,
        handleHeaderLayout,
        loadingMeta,
        t,
        symbol,
        payer,
        payeeAddress,
        balanceForMint,
        decimals,
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
          </Box>
        </Box>
      )
    }, [handleSetMax, maxEnabled, payer, t])

    const hasSufficientBalance = useMemo(() => {
      if (!payer) return true

      if (!networkFee || !valueAsBalance || !balanceForMint) {
        return false
      }

      return new BN(balanceForMint.toString())
        .sub(valueAsBalance)
        .gte(new BN(0))
    }, [networkFee, payer, valueAsBalance, balanceForMint])

    const handleConfirm = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()

      if (!valueAsBalance || typeof decimals === 'undefined') return

      onConfirmBalance({
        balance: valueAsBalance,
        payee: payeeAddress,
        max: maxEnabled,
        index: paymentIndex,
      })
      bottomSheetModalRef.current?.dismiss()
    }, [
      valueAsBalance,
      maxEnabled,
      decimals,
      onConfirmBalance,
      payeeAddress,
      paymentIndex,
    ])

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
      setMaxEnabled(false)
      setValue((prevVal) => prevVal.substring(0, prevVal.length - 1) || '0')
    }, [])

    const handleNumber = useCallback(
      (nextDigit: number) => {
        if (hasMaxDecimals) return
        setMaxEnabled(false)
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
                  {`${value || '0'} ${symbol || ''}`}
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
                      value: networkFee && humanReadable(networkFee, 9),
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
                      allowOverdraft || hasSufficientBalance
                        ? 'surface'
                        : 'grey300'
                    }
                    disabled={!allowOverdraft ? !hasSufficientBalance : false}
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
