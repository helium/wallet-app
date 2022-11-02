import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import SuccessIcon from '@assets/images/paymentSuccess.svg'
import BackgroundFill from '../../components/BackgroundFill'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { Payment } from './PaymentItem'
import PaymentSummary from './PaymentSummary'

type Props = {
  totalBalance: Balance<TestNetworkTokens | NetworkTokens>
  feeTokenBalance?: Balance<TestNetworkTokens | NetworkTokens>
  payments: Payment[]
  onSuccess: () => void
  actionTitle: string
  collectableSymbol?: string
}

const PaymentSuccess = ({
  totalBalance,
  feeTokenBalance,
  payments,
  onSuccess,
  actionTitle,
  collectableSymbol,
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
          totalBalance={totalBalance}
          feeTokenBalance={feeTokenBalance}
          payments={payments}
          alwaysShowRecipients
          collectableSymbol={collectableSymbol}
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
