import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AccountIcon from '../../components/AccountIcon'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { balanceToString } from '../../utils/Balance'
import { Payment } from './PaymentItem'

type Props = {
  totalBalance: Balance<TestNetworkTokens | NetworkTokens>
  feeTokenBalance?: Balance<TestNetworkTokens | NetworkTokens>
  disabled?: boolean
  errors?: string[]
  payments: Payment[]
  alwaysShowRecipients?: boolean
}

const MAX_ACCOUNT_ICONS = 3

const PaymentSummary = ({
  totalBalance,
  feeTokenBalance,
  disabled = false,
  payments,
  errors,
  alwaysShowRecipients,
}: Props) => {
  const { t } = useTranslation()

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
    () => alwaysShowRecipients || (payments.length > 1 && !disabled),
    [alwaysShowRecipients, disabled, payments.length],
  )

  const accountIcons = useMemo(() => {
    const icons = payments
      .slice(0, MAX_ACCOUNT_ICONS)
      .map(({ address }, index) => (
        <Box key={address} style={{ marginLeft: index * -4 }}>
          <AccountIcon address={address} size={16} />
        </Box>
      ))
    if (payments.length > MAX_ACCOUNT_ICONS) {
      icons.push(
        <Box
          style={{ marginLeft: MAX_ACCOUNT_ICONS * -4 }}
          width={16}
          borderRadius="round"
          height={16}
          backgroundColor="black300"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-evenly"
        >
          <Box
            width={2}
            height={2}
            backgroundColor="surfaceSecondaryText"
            borderRadius="round"
          />
          <Box
            width={2}
            height={2}
            backgroundColor="surfaceSecondaryText"
            borderRadius="round"
          />
          <Box
            width={2}
            height={2}
            backgroundColor="surfaceSecondaryText"
            borderRadius="round"
          />
        </Box>,
      )
    }
    return icons
  }, [payments])

  return (
    <>
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
              {t('payment.totalRecipients', { count: payments.length })}
            </Text>
          </>
        )}
        {!!errors?.length && (
          <Text variant="body2" color="error">
            {errors[0]}
          </Text>
        )}
        <Text variant="body2" color="secondaryText" flex={1} textAlign="right">
          {fee}
        </Text>
      </Box>
    </>
  )
}

export default memo(PaymentSummary)
