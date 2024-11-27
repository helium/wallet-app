import Box from '@components/Box'
import { PaymentV2 } from '@helium/transactions'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ButtonPressable from '@components/ButtonPressable'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { checkSecureAccount } from '@config/storage/secureStorage'
import { SendDetails } from '../../utils/linking'
import PaymentSummary from './PaymentSummary'

type Props = {
  totalBalance: BN
  feeTokenBalance?: BN
  onSubmit: (opts?: { txn: PaymentV2; txnJson: string }) => void
  disabled?: boolean
  errors?: string[]
  payments?: SendDetails[]
  mint: PublicKey
  loading?: boolean
}

const PaymentCard = ({
  totalBalance,
  feeTokenBalance,
  onSubmit,
  disabled,
  mint,
  payments,
  errors,
  loading,
}: Props) => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()

  const handleSubmit = useCallback(async () => {
    if (!currentAccount?.ledgerDevice && !currentAccount?.keystoneDevice) {
      const hasSecureAccount = await checkSecureAccount(
        currentAccount?.address,
        true,
      )
      if (!hasSecureAccount) return
    }
    onSubmit()
  }, [onSubmit, currentAccount])

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
        <>
          <Box flexDirection="row" marginTop="6" marginBottom="4">
            <ButtonPressable
              flex={1}
              backgroundColor="primaryText"
              onPress={handleSubmit}
              disabled={disabled}
              title={t('payment.pay')}
              titleColor="primaryBackground"
              titleColorDisabled="text.disabled"
              backgroundColorDisabled="bg.disabled"
              loading={loading}
              customLoadingColor="primaryBackground"
              customLoadingColorDisabled="text.disabled"
            />
          </Box>
        </>
      </Box>
    </Box>
  )
}

export default memo(PaymentCard)
