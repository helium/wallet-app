import SuccessIcon from '@assets/images/paymentSuccess.svg'
import BackgroundFill from '@components/BackgroundFill'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Payment } from './PaymentItem'
import PaymentSummary from './PaymentSummary'

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
  return (
    <Box flex={1} justifyContent="flex-end">
      <Box padding="l" paddingBottom="none">
        <SuccessIcon />
      </Box>
      <Text variant="h2" color="surfaceText" padding="l">
        {t('payment.submitSuccess')}
      </Text>
      <Box
        borderTopLeftRadius="xl"
        borderTopRightRadius="xl"
        padding="l"
        overflow="hidden"
      >
        <BackgroundFill backgroundColor="secondary" opacity={0.4} />
        <PaymentSummary
          mint={mint}
          totalBalance={totalBalance}
          feeTokenBalance={feeTokenBalance}
          payments={payments}
          alwaysShowRecipients
        />
        <TouchableOpacityBox
          marginTop="xxl"
          marginBottom="m"
          onPress={onSuccess}
          backgroundColor="blueBright500"
          paddingVertical="m"
          borderRadius="round"
          alignItems="center"
        >
          <Text variant="body1" color="black900">
            {actionTitle}
          </Text>
        </TouchableOpacityBox>
      </Box>
    </Box>
  )
}

export default memo(PaymentSuccess)
