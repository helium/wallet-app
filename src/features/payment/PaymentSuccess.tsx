import SuccessIcon from '@assets/svgs/paymentSuccess.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { NavBarHeight } from '@components/ServiceNavBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const { bottom } = useSafeAreaInsets()

  return (
    <Box flex={1} justifyContent="flex-end" backgroundColor="primaryBackground">
      <Box padding="6" paddingBottom="0">
        <SuccessIcon />
      </Box>
      <Text variant="displaySmRegular" color="secondaryText" padding="6">
        {t('payment.submitSuccess')}
      </Text>
      <Box
        borderTopLeftRadius="4xl"
        borderTopRightRadius="4xl"
        padding="6"
        overflow="hidden"
        style={{
          paddingBottom: NavBarHeight + bottom,
        }}
        backgroundColor="cardBackground"
      >
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
          backgroundColor="primaryText"
          paddingVertical="4"
          borderRadius="full"
          alignItems="center"
        >
          <Text variant="textMdRegular" color="primaryBackground">
            {actionTitle}
          </Text>
        </TouchableOpacityBox>
      </Box>
    </Box>
  )
}

export default memo(PaymentSuccess)
