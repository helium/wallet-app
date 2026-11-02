import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
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
import { NATIVE_MINT } from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import type { CSAccount } from '@storage/cloudStorage'
import { useContentColumnMargins } from '@utils/layout'
import { decimalSeparator, groupSeparator } from '@utils/i18n'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import { ArrowUpRight } from 'lucide-react-native'
import React, {
  type ReactNode,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { type LayoutChangeEvent, Platform, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import type { Payment } from '../features/payment/PaymentItem'
import { AccountIcon } from './AccountIcon'
import { Button } from './Button'
import { useSheetMargins } from './ContentColumn'
import { Keypad, type KeypadInput } from './Keypad'
import { PressableScale } from './PressableScale'
import { SheetBackground, SheetHandle } from './Sheet'
import { Text } from './Text'
import { twMerge } from './twMerge'

const ArrowUpRightIcon = withUniwind(ArrowUpRight)
const StyledSafeAreaView = withUniwind(SafeAreaView)

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

export type HNTKeyboardProps = {
  ref?: React.Ref<HNTKeyboardRef>
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
  className?: string
}

// The amount entry sheet. Open it with `ref.current.show()`; Confirm reports
// the typed amount in the mint's base units.
export const HNTKeyboard = ({
  ref,
  minTokens,
  children,
  onConfirmBalance,
  handleVisible,
  mint,
  networkFee,
  usePortal = false,
  allowOverdraft = false,
  actionableAmount,
  className,
}: HNTKeyboardProps) => {
  const decimals = useMint(mint)?.info?.decimals
  const { t } = useTranslation()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const sheetMargins = useSheetMargins()
  // With usePortal the sheet mounts at the root portal host, outside the column
  const portalMargins = useContentColumnMargins()
  const { symbol, loading: loadingMeta } = useMetaplexMetadata(mint)
  const [value, setValue] = useState('0')
  const [originalValue, setOriginalValue] = useState('')
  const [payee, setPayee] = useState<CSAccount | string | null | undefined>()
  const [payments, setPayments] = useState<Payment[]>()
  const [payer, setPayer] = useState<CSAccount | null | undefined>()
  const [paymentIndex, setPaymentIndex] = useState<number>()
  const [containerHeight, setContainerHeight] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [maxEnabled, setMaxEnabled] = useState(false)
  const { top } = useSafeAreaInsets()
  const containerStyle =
    Platform.OS === 'android' ? { paddingTop: top } : undefined
  const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
  const wallet = useCurrentWallet()

  const { amount: balanceForMintToken } = useOwnedAmount(wallet, mint)
  const { amount: solBalance } = useSolOwnedAmount(wallet)
  const balanceForMint =
    actionableAmount ||
    (mint?.equals(NATIVE_MINT) ? solBalance : balanceForMintToken)

  const sheetHeight = containerHeight - headerHeight
  const snapPoints = [sheetHeight > 0 ? sheetHeight : 600]

  let payeeAddress: string | undefined
  if (payee && typeof payee === 'string') {
    payeeAddress = payee
  } else if ((payee as CSAccount)?.address) {
    payeeAddress = (payee as CSAccount).address
  }

  const valueAsBalance = (() => {
    if (!value || typeof decimals === 'undefined') return undefined
    const [whole, dec] = value.split(decimalSeparator)
    const decPart = (dec || '').padEnd(decimals, '0').slice(0, decimals)
    const fullStr = `${whole.replaceAll(groupSeparator, '')}${decPart}`

    return new BN(fullStr)
  })()

  const hasMaxDecimals = (() => {
    if (!valueAsBalance || typeof decimals === 'undefined') return false
    const valueString = value
      .replaceAll(groupSeparator, '')
      .replaceAll(decimalSeparator, '.')
    if (!valueString.includes('.')) return false

    const [, dec] = valueString.split('.')
    return dec.length >= decimals
  })()

  const getNextPayments = () => {
    if (payments && paymentIndex !== undefined) {
      return payments.map((p, mapIndex) => {
        if (mapIndex !== paymentIndex) {
          return p
        }
        return { ...p, amount: valueAsBalance }
      })
    }
    return [{ amount: valueAsBalance, address: payeeAddress }]
  }

  const show = (opts: ShowOptions) => {
    handleVisible?.(true)

    setPayer(opts.payer)
    setPayee(opts.payee)
    setPaymentIndex(opts.index)
    setPayments(opts.payments)
    setContainerHeight(opts.containerHeight || 0)
    // Initialize from the payment being edited so a prior payment's max
    // toggle doesn't leak into this one
    setMaxEnabled(opts.payments?.[opts.index ?? -1]?.max ?? false)

    const val =
      opts.balance && typeof decimals !== 'undefined'
        ? humanReadable(opts.balance, decimals)
        : undefined
    setValue(val || '0')

    bottomSheetModalRef.current?.present()
    setIsShowing(true)
  }

  const hide = () => {
    bottomSheetModalRef.current?.dismiss()
  }

  useImperativeHandle(ref, () => ({ show, hide }))

  const handleHeaderLayout = (layout: LayoutChangeEvent) =>
    setHeaderHeight(layout.nativeEvent.layout.height)

  const handleSetMax = () => {
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
  }

  const header = (
    <View className="items-center p-6" onLayout={handleHeaderLayout}>
      {!loadingMeta && (
        <Text size="lg" className="font-medium">
          {t('hntKeyboard.enterAmount', {
            ticker: symbol || '',
          })}
        </Text>
      )}
      <View className="mt-8 flex-row items-center">
        {payer && (
          <>
            <AccountIcon
              size={40}
              address={payer?.address || payer?.solanaAddress}
            />

            <View className="p-2">
              <ArrowUpRightIcon colorClassName="accent-muted-foreground" />
            </View>
          </>
        )}
        {payeeAddress && (
          <AccountIcon size={40} address={payeeAddress || '1'} />
        )}
      </View>
      <Text className="my-5">
        {payer && balanceForMint && typeof decimals !== 'undefined'
          ? t('hntKeyboard.hntAvailable', {
              amount:
                typeof decimals !== 'undefined' &&
                humanReadable(new BN(balanceForMint.toString()), decimals),
            })
          : ''}
      </Text>
    </View>
  )

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      disappearsOnIndex={-1}
      opacity={1}
      appearsOnIndex={0}
      {...props}
    >
      {usePortal ? (
        <StyledSafeAreaView
          edges={['top']}
          className="flex-1"
          style={containerStyle}
        >
          {header}
        </StyledSafeAreaView>
      ) : (
        <View className="flex-1" style={containerStyle}>
          {header}
        </View>
      )}
    </BottomSheetBackdrop>
  )

  const renderHandle = () => {
    if (!payer) {
      return <SheetHandle />
    }
    return (
      <View className="m-4 mb-0 flex-row">
        <View className="flex-1" />
        <View className="h-1 w-9 self-center rounded-full bg-foreground/20" />
        <View className="flex-1 items-end">
          <PressableScale
            feedback="opacity"
            onPress={handleSetMax}
            className={twMerge(
              'mb-2 rounded-md border-[1.5px] px-3 py-1',
              maxEnabled
                ? 'border-transparent bg-primary'
                : 'border-border bg-transparent',
            )}
          >
            <Text
              size="base"
              className={twMerge(
                'text-center font-medium',
                maxEnabled
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {t('payment.max')}
            </Text>
          </PressableScale>
        </View>
      </View>
    )
  }

  const hasSufficientBalance = (() => {
    if (!payer) return true

    if (!networkFee || !valueAsBalance || !balanceForMint) {
      return false
    }

    return new BN(balanceForMint.toString()).sub(valueAsBalance).gte(new BN(0))
  })()

  const handleConfirm = () => {
    bottomSheetModalRef.current?.dismiss()

    if (!valueAsBalance || typeof decimals === 'undefined') return

    onConfirmBalance({
      balance: valueAsBalance,
      payee: payeeAddress,
      max: maxEnabled,
      index: paymentIndex,
    })
    bottomSheetModalRef.current?.dismiss()
  }

  const handleCancel = () => {
    setValue(originalValue)
    bottomSheetModalRef.current?.dismiss()
  }

  const handleDecimal = () => {
    setValue((prevVal) => {
      if (prevVal.includes(decimalSeparator)) return prevVal
      return prevVal + decimalSeparator
    })
  }

  const handleBackspace = () => {
    setMaxEnabled(false)
    setValue((prevVal) => prevVal.substring(0, prevVal.length - 1) || '0')
  }

  const handleNumber = (nextDigit: number) => {
    if (hasMaxDecimals) return
    setMaxEnabled(false)
    setValue((prevVal) => {
      if (prevVal !== '0') {
        return `${prevVal}${nextDigit}`
      }
      return nextDigit.toString()
    })
  }

  const handlePress = (input?: KeypadInput) => {
    if (typeof input === 'number') {
      handleNumber(input)
    } else if (input === 'backspace') {
      handleBackspace()
    } else {
      handleDecimal()
    }
  }

  const handleChange = (idx: number) => {
    if (idx < 0) return

    setOriginalValue(value)
  }

  const handleModalDismiss = () => {
    handleDismiss()
    handleVisible?.(false)
  }

  const sheet = (
    <BottomSheetModalProvider>
      <BottomSheetModal
        onChange={handleChange}
        ref={bottomSheetModalRef}
        style={usePortal ? portalMargins : sheetMargins}
        index={0}
        backgroundComponent={SheetBackground}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        snapPoints={snapPoints}
        onDismiss={handleModalDismiss}
      >
        <BottomSheetView className="flex-1">
          <StyledSafeAreaView
            edges={['bottom']}
            className="flex-1 items-center"
          >
            <Text
              size="4xl"
              className="mx-6"
              maxFontSizeMultiplier={1}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {`${value || '0'} ${symbol || ''}`}
            </Text>
            {payer && networkFee && (
              <Text
                size="base"
                className="mb-6 px-4 text-muted-foreground"
                maxFontSizeMultiplier={1}
                numberOfLines={1}
              >
                {t('hntKeyboard.fee', {
                  value: networkFee && humanReadable(networkFee, 9),
                })}
              </Text>
            )}
            <Keypad
              customButtonType="decimal"
              onPress={handlePress}
              className="mx-6"
            />
            <View className="m-6 flex-row gap-2">
              <Button
                variant="outline"
                size="dashboard"
                className="flex-1"
                onPress={handleCancel}
              >
                {t('generic.cancel')}
              </Button>
              <Button
                testID="HNTKeyboard.Confirm"
                variant="cta"
                size="dashboard"
                className="flex-1"
                onPress={handleConfirm}
                disabled={!allowOverdraft ? !hasSufficientBalance : false}
              >
                {t('generic.confirm')}
              </Button>
            </View>
          </StyledSafeAreaView>
        </BottomSheetView>
      </BottomSheetModal>
      {!usePortal && children}
    </BottomSheetModalProvider>
  )

  return (
    <View className={twMerge('flex-1', className)}>
      {usePortal ? <Portal>{sheet}</Portal> : sheet}
      {usePortal && children}
    </View>
  )
}
