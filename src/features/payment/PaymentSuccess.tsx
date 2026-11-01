import { PublicKey } from '@solana/web3.js'
import { Button } from '@ui/Button'
import { SuccessReveal } from '@ui/SuccessReveal'
import { Text } from '@ui/Text'
import BN from 'bn.js'
import { CircleCheck } from 'lucide-react-native'
import React, { memo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { Payment } from './PaymentItem'
import PaymentSummary from './PaymentSummary'

const SuccessIcon = withUniwind(CircleCheck)

type Props = {
  mint: PublicKey
  totalBalance: BN
  feeTokenBalance?: BN
  payments: Payment[]
  onSuccess: () => void
  actionTitle: string
}

const PaymentSuccess = ({
  totalBalance,
  feeTokenBalance,
  payments,
  onSuccess,
  actionTitle,
  mint,
}: Props) => {
  const { t } = useTranslation()
  // The success view is the end of the flow, so Done leaves it once.
  const left = useRef(false)
  const handleDone = () => {
    if (left.current) return
    left.current = true
    onSuccess()
  }
  return (
    <View className="flex-1 justify-end">
      <SuccessReveal
        icon={
          <View className="px-6 pt-6">
            <SuccessIcon size={56} colorClassName="accent-success-500" />
          </View>
        }
      >
        <Text
          testID="PaymentSuccess.Title"
          size="3xl"
          className="p-6 text-card-foreground"
        >
          {t('payment.submitSuccess')}
        </Text>
        <View className="overflow-hidden rounded-t-[20px] bg-secondary p-6">
          <PaymentSummary
            mint={mint}
            totalBalance={totalBalance}
            feeTokenBalance={feeTokenBalance}
            payments={payments}
            alwaysShowRecipients
          />
          <Button
            testID="PaymentSuccess.Done"
            variant="cta"
            size="lg"
            className="mb-4 mt-12 w-full"
            onPress={handleDone}
          >
            {actionTitle}
          </Button>
        </View>
      </SuccessReveal>
    </View>
  )
}

export default memo(PaymentSuccess)
