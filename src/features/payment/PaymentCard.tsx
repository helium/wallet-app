import { SubmitButton } from '@ui/SubmitButton'
import { PaymentV2 } from '@helium/transactions'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { Button } from '@ui/Button'
import BN from 'bn.js'
import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View } from 'react-native'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { checkSecureAccount } from '../../storage/secureStorage'
import animateTransition from '../../utils/animateTransition'
import { SendDetails } from '../../utils/linking'
import PaymentSummary from './PaymentSummary'

type Props = {
  handleCancel: () => void
  totalBalance: BN
  feeTokenBalance?: BN
  onSubmit: (opts?: { txn: PaymentV2; txnJson: string }) => void
  disabled?: boolean
  errors?: string[]
  payments?: SendDetails[]
  mint: PublicKey
}

const PaymentCard = ({
  handleCancel,
  totalBalance,
  feeTokenBalance,
  onSubmit,
  disabled,
  mint,
  payments,
  errors,
}: Props) => {
  const { symbol } = useMetaplexMetadata(mint)
  const { t } = useTranslation()
  const [payEnabled, setPayEnabled] = useState(false)
  const [height, setHeight] = useState(0)
  const { currentAccount } = useAccountStorage()

  const handlePayPressed = useCallback(async () => {
    if (!currentAccount?.ledgerDevice && !currentAccount?.keystoneDevice) {
      const hasSecureAccount = await checkSecureAccount(
        currentAccount?.address,
        true,
      )
      if (!hasSecureAccount) return
    }
    animateTransition('PaymentCard.payEnabled')
    setPayEnabled(true)
  }, [
    currentAccount?.ledgerDevice,
    currentAccount?.address,
    currentAccount?.keystoneDevice,
  ])

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (height > 0) return
      setHeight(e.nativeEvent.layout.height)
    },
    [height],
  )

  const handleSubmit = onSubmit

  return (
    <View
      className="min-h-[232px] overflow-hidden rounded-t-[20px] bg-secondary p-6"
      style={{ height: height || undefined }}
      onLayout={handleLayout}
    >
      <PaymentSummary
        mint={mint}
        totalBalance={totalBalance}
        feeTokenBalance={feeTokenBalance}
        disabled={disabled}
        payments={payments}
        errors={errors}
      />
      <View className="flex-1 justify-end">
        {!payEnabled ? (
          <View className="mb-4 mt-6 flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onPress={handleCancel}
            >
              {t('generic.cancel')}
            </Button>
            <Button
              testID="PaymentCard.Pay"
              variant="cta"
              size="lg"
              className="flex-1"
              onPress={() => void handlePayPressed().catch(console.error)}
              disabled={disabled}
            >
              {t('payment.pay')}
            </Button>
          </View>
        ) : (
          <SubmitButton
            className="mt-6"
            title={t('payment.sendButton', {
              ticker: symbol,
            })}
            onSubmit={handleSubmit}
            disabled={disabled}
          />
        )}
      </View>
    </View>
  )
}

export default memo(PaymentCard)
