import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import Text from '@components/Text'
import { useMint } from '@helium/helium-react-hooks'
import { PublicKey } from '@solana/web3.js'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Payment } from './PaymentItem'

type Props = {
  mint: PublicKey
  totalBalance: BN
  feeTokenBalance?: BN
  disabled?: boolean
  errors?: string[]
  payments?: Payment[]
  alwaysShowRecipients?: boolean
}

const MAX_ACCOUNT_ICONS = 3

const PaymentSummary = ({
  totalBalance,
  feeTokenBalance,
  disabled = false,
  payments = [],
  errors,
  alwaysShowRecipients,
  mint,
}: Props) => {
  const { t } = useTranslation()
  const decimals = useMint(mint)?.info?.decimals

  const total = useMemo(() => {
    return humanReadable(totalBalance, decimals) || ''
  }, [totalBalance, decimals])
  const fee = useMemo(
    () =>
      feeTokenBalance
        ? t('payment.fee', {
            value: humanReadable(feeTokenBalance, 9),
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
      .map(({ address }, index) => {
        return (
          // eslint-disable-next-line react/no-array-index-key
          <Box key={`${index}.${address}`} style={{ marginLeft: index * -4 }}>
            <AccountIcon address={address} size={16} />
          </Box>
        )
      })
    if (payments.length > MAX_ACCOUNT_ICONS) {
      icons.push(
        <Box
          key="ellipsis"
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
        {showRecipients && payments.length > 0 && (
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
