import FailureIcon from '@assets/images/paymentFailure.svg'
import BackgroundFill from '@components/BackgroundFill'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { SerializedError } from '@reduxjs/toolkit'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { parseTransactionError } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Payment } from './PaymentItem'
import PaymentSummary from './PaymentSummary'

type Props = {
  mint: PublicKey
  totalBalance: BN
  feeTokenBalance?: BN
  payments: Payment[]
  error?: Error | SerializedError
  onRetry: () => void
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
    <Box flex={1} justifyContent="flex-end">
      <Box padding="6" paddingBottom="0">
        <FailureIcon />
      </Box>
      <Text variant="displaySmRegular" color="secondaryText" padding="6">
        {t('payment.submitFailed')}
      </Text>
      {!!errorMessage && (
        <Text
          variant="textMdRegular"
          color="error.500"
          paddingHorizontal="6"
          paddingTop="0"
          paddingBottom="12"
        >
          {errorMessage}
        </Text>
      )}
      <Box
        borderTopLeftRadius="4xl"
        borderTopRightRadius="4xl"
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
        <Box flexDirection="row" marginTop="12">
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            justifyContent="center"
            marginEnd="4"
            borderRadius="full"
            onPress={navigation.goBack}
            overflow="hidden"
          >
            <BackgroundFill backgroundColor="error.500" />
            <Text variant="textXlMedium" textAlign="center" color="error.500">
              {t('generic.cancel')}
            </Text>
          </TouchableOpacityBox>
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            backgroundColor="secondaryBackground"
            justifyContent="center"
            alignItems="center"
            borderRadius="full"
            onPress={onRetry}
            flexDirection="row"
          >
            <Text
              marginLeft="2"
              variant="textXlMedium"
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
