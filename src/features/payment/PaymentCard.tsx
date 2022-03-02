import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import AccountIcon from '../../components/AccountIcon'
import Box from '../../components/Box'
import SubmitButton from '../../components/SubmitButton'
import Text from '../../components/Text'
import { useColors } from '../../theme/themeHooks'
import { balanceToString } from '../../utils/Balance'
import { Payment } from './PaymentItem'

type Props = {
  totalBalance: Balance<TestNetworkTokens | NetworkTokens>
  feeTokenBalance?: Balance<TestNetworkTokens | NetworkTokens>
  onSubmit: () => void
  disabled: boolean
  submitLoading: boolean
  insufficientFunds: boolean
  payments: Payment[]
}
const PaymentCard = ({
  totalBalance,
  feeTokenBalance,
  onSubmit,
  disabled,
  submitLoading,
  payments,
  insufficientFunds,
}: Props) => {
  const { t } = useTranslation()
  const { primaryText } = useColors()

  const total = useMemo(() => balanceToString(totalBalance), [totalBalance])
  const fee = useMemo(
    () =>
      feeTokenBalance
        ? t('payment.fee', {
            value: balanceToString(feeTokenBalance, {
              maxDecimalPlaces: 4,
            }),
          })
        : '',
    [feeTokenBalance, t],
  )

  const showRecipients = useMemo(
    () => payments.length > 1 && !disabled,
    [disabled, payments.length],
  )

  const accountIcons = useMemo(
    () =>
      payments.map(({ address }, index) => (
        <Box key={address} style={{ marginLeft: index * -4 }}>
          <AccountIcon address={address} size={16} />
        </Box>
      )),
    [payments],
  )

  return (
    <Box
      backgroundColor="secondary"
      borderTopLeftRadius="xl"
      borderTopRightRadius="xl"
      padding="l"
    >
      <Box flexDirection="row" alignItems="center">
        <Text variant="body1" color="primaryText" flex={1}>
          {t('payment.total')}
        </Text>
        <Text variant="h3" color="primaryText">
          {total}
        </Text>
      </Box>

      <Box flexDirection="row" alignItems="center">
        {showRecipients && (
          <>
            {accountIcons}
            <Text variant="body2" color="secondaryText" marginLeft="s">
              {t('payment.totalRecipients', { total: payments.length })}
            </Text>
          </>
        )}
        {insufficientFunds && (
          <Text variant="body2" color="error">
            {t('payment.insufficientFunds')}
          </Text>
        )}
        <Text variant="body2" color="secondaryText" flex={1} textAlign="right">
          {fee}
        </Text>
      </Box>
      <Box marginTop="xxl">
        <SubmitButton
          title={t('payment.sendButton', {
            ticker: totalBalance?.type.ticker,
          })}
          onSubmit={onSubmit}
          disabled={disabled}
        />
        {submitLoading && (
          <Box
            position="absolute"
            top={0}
            bottom={0}
            justifyContent="center"
            marginLeft="lm"
          >
            <ActivityIndicator color={primaryText} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default memo(PaymentCard)
