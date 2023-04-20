import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import { useNavigation } from '@react-navigation/native'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FailureIcon from '@assets/images/paymentFailure.svg'
import { ApolloError } from '@apollo/client'
import { SerializedError } from '@reduxjs/toolkit'
import BackgroundFill from '@components/BackgroundFill'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { parseTransactionError } from '@utils/solanaUtils'
import { Payment } from './PaymentItem'
import PaymentSummary from './PaymentSummary'

type Props = {
  totalBalance: Balance<TestNetworkTokens | NetworkTokens>
  feeTokenBalance?: Balance<TestNetworkTokens | NetworkTokens>
  payments: Payment[]
  error?: ApolloError | Error | SerializedError
  onRetry: () => void
}

const PaymentError = ({
  totalBalance,
  feeTokenBalance,
  payments,
  error,
  onRetry,
}: Props) => {
  const navigation = useNavigation()
  const { t } = useTranslation()
  const errorMessage = useMemo(() => {
    if (!error) return ''

    return parseTransactionError(error.message)
  }, [error])

  return (
    <Box flex={1} justifyContent="flex-end">
      <Box padding="l" paddingBottom="none">
        <FailureIcon />
      </Box>
      <Text variant="h2" color="surfaceText" padding="l">
        {t('payment.submitFailed')}
      </Text>
      {!!errorMessage && (
        <Text
          variant="body1"
          color="error"
          paddingHorizontal="l"
          paddingTop="none"
          paddingBottom="xxl"
        >
          {errorMessage}
        </Text>
      )}
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
        />
        <Box flexDirection="row" marginTop="xxl">
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            justifyContent="center"
            marginEnd="m"
            borderRadius="round"
            onPress={navigation.goBack}
            overflow="hidden"
          >
            <BackgroundFill backgroundColor="error" />
            <Text variant="subtitle1" textAlign="center" color="error">
              {t('generic.cancel')}
            </Text>
          </TouchableOpacityBox>
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            backgroundColor="secondary"
            justifyContent="center"
            alignItems="center"
            borderRadius="round"
            onPress={onRetry}
            flexDirection="row"
          >
            <Text
              marginLeft="s"
              variant="subtitle1"
              textAlign="center"
              color="primaryText"
            >
              {t('generic.retry')}
            </Text>
          </TouchableOpacityBox>
        </Box>
      </Box>
    </Box>
  )
}

export default memo(PaymentError)
