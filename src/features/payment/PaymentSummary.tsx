import { useMint } from '@helium/helium-react-hooks'
import { PublicKey } from '@solana/web3.js'
import { AccountIcon } from '@ui/AccountIcon'
import { Text } from '@ui/Text'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
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
          <View key={`${index}.${address}`} style={{ marginLeft: index * -4 }}>
            <AccountIcon address={address} size={16} />
          </View>
        )
      })
    if (payments.length > MAX_ACCOUNT_ICONS) {
      icons.push(
        <View
          key="ellipsis"
          style={{ marginLeft: MAX_ACCOUNT_ICONS * -4 }}
          className="size-4 flex-row items-center justify-evenly rounded-full bg-primary"
        >
          <View className="size-0.5 rounded-full bg-muted-foreground" />
          <View className="size-0.5 rounded-full bg-muted-foreground" />
          <View className="size-0.5 rounded-full bg-muted-foreground" />
        </View>,
      )
    }
    return icons
  }, [payments])

  return (
    <>
      <View className="flex-row items-center">
        <Text size="base" className="flex-1">
          {t('payment.total')}
        </Text>
        <Text size="2xl">{total}</Text>
      </View>

      <View className="flex-row items-center">
        {showRecipients && payments.length > 0 && (
          <>
            {accountIcons}
            <Text className="ml-2 text-muted-foreground">
              {t('payment.totalRecipients', { count: payments.length })}
            </Text>
          </>
        )}
        {!!errors?.length && (
          <Text className="text-destructive">{errors[0]}</Text>
        )}
        <Text className="flex-1 text-right text-muted-foreground">{fee}</Text>
      </View>
    </>
  )
}

export default memo(PaymentSummary)
