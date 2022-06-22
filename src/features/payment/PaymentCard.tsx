import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import { PaymentV2 } from '@helium/transactions'
import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import BackgroundFill from '../../components/BackgroundFill'
import Box from '../../components/Box'
import LedgerPayment, { LedgerPaymentRef } from '../../components/LedgerPayment'
import SubmitButton from '../../components/SubmitButton'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { SendDetails } from '../../storage/TransactionProvider'
import animateTransition from '../../utils/animateTransition'
import useAlert from '../../utils/useAlert'
import PaymentSummary from './PaymentSummary'
import { checkSecureAccount } from '../../storage/secureStorage'

type Props = {
  totalBalance: Balance<TestNetworkTokens | NetworkTokens>
  feeTokenBalance?: Balance<TestNetworkTokens | NetworkTokens>
  onSubmit: (opts?: { txn: PaymentV2; txnJson: string }) => void
  disabled?: boolean
  errors?: string[]
  payments?: SendDetails[]
}

const PaymentCard = ({
  totalBalance,
  feeTokenBalance,
  onSubmit,
  disabled,
  payments,
  errors,
}: Props) => {
  const { t } = useTranslation()
  const [payEnabled, setPayEnabled] = useState(false)
  const [height, setHeight] = useState(0)
  const nav = useNavigation()
  const ledgerPaymentRef = useRef<LedgerPaymentRef>(null)
  const { showOKAlert } = useAlert()
  const { currentAccount } = useAccountStorage()
  const [options, setOptions] = useState<{
    txn: PaymentV2
    txnJson: string
  }>()

  const handlePayPressed = useCallback(async () => {
    if (!currentAccount?.ledgerDevice) {
      const hasSecureAccount = await checkSecureAccount(
        currentAccount?.address,
        true,
      )
      if (!hasSecureAccount) return
      animateTransition('PaymentCard.payEnabled')
      setPayEnabled(true)
    } else {
      // is ledger device
      ledgerPaymentRef.current?.show({
        payments: payments || [],
        ledgerDevice: currentAccount.ledgerDevice,
        address: currentAccount.address,
        speculativeNonce: 0,
      })
    }
  }, [currentAccount, payments])

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (height > 0) return
      setHeight(e.nativeEvent.layout.height)
    },
    [height],
  )
  const handleConfirm = useCallback(
    (opts: { txn: PaymentV2; txnJson: string }) => {
      setPayEnabled(true)
      setOptions(opts)
    },
    [],
  )

  const handleSubmit = useCallback(() => {
    onSubmit(options)
  }, [onSubmit, options])

  const handleLedgerError = useCallback(
    (error: Error) => {
      showOKAlert({ title: t('generic.error'), message: error.toString() })
    },
    [showOKAlert, t],
  )

  return (
    <LedgerPayment
      ref={ledgerPaymentRef}
      onConfirm={handleConfirm}
      onError={handleLedgerError}
    >
      <Box
        borderTopLeftRadius="xl"
        borderTopRightRadius="xl"
        padding="l"
        height={height || undefined}
        onLayout={handleLayout}
        overflow="hidden"
        minHeight={240}
      >
        <BackgroundFill backgroundColor="secondary" opacity={0.4} />

        <PaymentSummary
          totalBalance={totalBalance}
          feeTokenBalance={feeTokenBalance}
          disabled={disabled}
          payments={payments}
          errors={errors}
        />
        <Box flex={1} justifyContent="flex-end">
          {!payEnabled ? (
            <>
              <Box flexDirection="row" marginTop="l">
                <TouchableOpacityBox
                  flex={1}
                  minHeight={66}
                  justifyContent="center"
                  marginEnd="m"
                  borderRadius="round"
                  overflow="hidden"
                  backgroundColor="secondaryIcon"
                  onPress={nav.goBack}
                >
                  <Text
                    variant="subtitle1"
                    textAlign="center"
                    color="primaryText"
                  >
                    {t('generic.cancel')}
                  </Text>
                </TouchableOpacityBox>
                <TouchableOpacityBox
                  flex={1}
                  minHeight={66}
                  backgroundColor={disabled ? 'secondary' : 'surfaceContrast'}
                  justifyContent="center"
                  alignItems="center"
                  onPress={handlePayPressed}
                  disabled={disabled}
                  borderRadius="round"
                  flexDirection="row"
                >
                  <Text
                    marginLeft="s"
                    variant="subtitle1"
                    textAlign="center"
                    color={disabled ? 'surface' : 'secondary'}
                  >
                    {t('payment.pay')}
                  </Text>
                </TouchableOpacityBox>
              </Box>
            </>
          ) : (
            <SubmitButton
              marginTop="l"
              title={t('payment.sendButton', {
                ticker: totalBalance?.type.ticker,
              })}
              onSubmit={handleSubmit}
            />
          )}
        </Box>
      </Box>
    </LedgerPayment>
  )
}

export default memo(PaymentCard)
