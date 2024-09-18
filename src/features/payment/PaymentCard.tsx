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
import { LayoutChangeEvent } from 'react-native'
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
  const [height, setHeight] = useState(0)
  const { currentAccount } = useAccountStorage()

  const handlePayPressed = useCallback(async () => {
    if (!currentAccount?.ledgerDevice) {
      const hasSecureAccount = await checkSecureAccount(
        currentAccount?.address,
        true,
      )
      if (!hasSecureAccount) return
    }
    animateTransition('PaymentCard.payEnabled')
    setPayEnabled(true)
  }, [currentAccount?.ledgerDevice, currentAccount?.address])

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (height > 0) return
      setHeight(e.nativeEvent.layout.height)
    },
    [height],
  )

  const handleSubmit = onSubmit

  return (
    <Box
      borderTopLeftRadius="4xl"
      borderTopRightRadius="4xl"
      padding="6"
      height={height || undefined}
      onLayout={handleLayout}
      overflow="hidden"
      minHeight={232}
      backgroundColor="secondaryBackground"
    >
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
                justifyContent="center"
                marginEnd="4"
                borderRadius="full"
                overflow="hidden"
                backgroundColor="secondaryText"
                onPress={handleCancel}
              >
                <Text
                  variant="textXlMedium"
                  textAlign="center"
                  color="gray.600"
                >
                  {t('generic.cancel')}
                </Text>
              </TouchableOpacityBox>
              <TouchableOpacityBox
                flex={1}
                minHeight={66}
                backgroundColor="primaryBackground"
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
                  color={disabled ? 'text.disabled' : 'secondaryText'}
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
