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
      <Box padding="6" paddingBottom="0">
        <SuccessIcon />
      </Box>
      <Text variant="displaySmRegular" color="surfaceText" padding="6">
        {t('payment.submitSuccess')}
      </Text>
      <Box
        borderTopLeftRadius="8"
        borderTopRightRadius="8"
        padding="6"
        overflow="hidden"
      >
        <BackgroundFill backgroundColor="secondaryBackground" opacity={0.4} />
        <PaymentSummary
          mint={mint}
          totalBalance={totalBalance}
          feeTokenBalance={feeTokenBalance}
          payments={payments}
          alwaysShowRecipients
        />
        <TouchableOpacityBox
          marginTop="12"
          marginBottom="4"
          onPress={onSuccess}
          backgroundColor="blue.light-500"
          paddingVertical="4"
          borderRadius="full"
          alignItems="center"
        >
          <Text variant="textMdRegular" color="black">
            {actionTitle}
          </Text>
        </TouchableOpacityBox>
      </Box>
    </Box>
  )
}

export default memo(PaymentSuccess)
