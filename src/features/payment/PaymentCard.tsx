import Box from '@components/Box'
import SubmitButton from '@components/SubmitButton'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { PaymentV2 } from '@helium/transactions'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

  const handleSubmit = onSubmit

  return (
    <Box paddingHorizontal="8">
      <PaymentSummary
        mint={mint}
        totalBalance={totalBalance}
        feeTokenBalance={feeTokenBalance}
        disabled={disabled}
        payments={payments}
        errors={errors}
      />
      <Box flex={1} justifyContent="flex-end">
        {!payEnabled ? (
          <>
            <Box flexDirection="row" marginTop="6" marginBottom="4">
              <TouchableOpacityBox
                flex={1}
                minHeight={66}
                backgroundColor="primaryText"
                opacity={disabled ? 0.6 : 1}
                justifyContent="center"
                alignItems="center"
                onPress={handlePayPressed}
                disabled={disabled}
                borderRadius="full"
                flexDirection="row"
              >
                <Text
                  marginLeft="2"
                  variant="textXlMedium"
                  textAlign="center"
                  color={disabled ? 'text.disabled' : 'primaryBackground'}
                >
                  {t('payment.pay')}
                </Text>
              </TouchableOpacityBox>
            </Box>
          </>
        ) : (
          <SubmitButton
            marginTop="6"
            title={t('payment.sendButton', {
              ticker: symbol,
            })}
            onSubmit={handleSubmit}
          />
        )}
      </Box>
    </Box>
  )
}

export default memo(PaymentCard)
