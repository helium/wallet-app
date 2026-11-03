import { useOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import { parseTransactionError } from '@utils/solanaUtils'
import BN from 'bn.js'
import { CircleX } from 'lucide-react-native'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { Payment } from './PaymentItem'
import PaymentSummary from './PaymentSummary'

const FailureIcon = withUniwind(CircleX)

type Props = {
  mint: PublicKey
  totalBalance: BN
  feeTokenBalance?: BN
  payments: Payment[]
  error?: Error
  // Undefined when the app cannot tell what landed: close only.
  onRetry?: () => void
}

const PaymentError = ({
  totalBalance,
  feeTokenBalance,
  payments,
  error,
  onRetry,
  mint,
}: Props) => {
  const navigation = useNavigation()
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const { amount: solBalance } = useOwnedAmount(wallet, NATIVE_MINT)

  const errorMessage = useMemo(() => {
    if (!error) return ''

    return parseTransactionError(
      new BN(solBalance?.toString() || '0'),
      error.message,
    )
  }, [error, solBalance])

  return (
    <View className="flex-1 justify-end">
      <View className="px-6 pt-6">
        <FailureIcon size={56} colorClassName="accent-destructive" />
      </View>
      <Text size="3xl" className="p-6 text-card-foreground">
        {t('payment.submitFailed')}
      </Text>
      {!!errorMessage && (
        <Text size="base" className="px-6 pb-12 text-destructive">
          {errorMessage}
        </Text>
      )}
      <View className="overflow-hidden rounded-t-[20px] bg-secondary p-6">
        <PaymentSummary
          mint={mint}
          totalBalance={totalBalance}
          feeTokenBalance={feeTokenBalance}
          payments={payments}
          alwaysShowRecipients
        />
        <View className="mt-12 flex-row gap-4">
          <Button
            variant="outline"
            size="dashboard"
            className="flex-1"
            onPress={navigation.goBack}
          >
            {t('generic.cancel')}
          </Button>
          {onRetry && (
            <Button
              variant="secondary"
              size="dashboard"
              className="flex-1"
              onPress={onRetry}
            >
              {t('generic.retry')}
            </Button>
          )}
        </View>
      </View>
    </View>
  )
}

export default memo(PaymentError)
