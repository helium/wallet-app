import React, { useCallback, useMemo } from 'react'
import {
  format,
  formatDistance,
  formatDistanceToNow,
  fromUnixTime,
} from 'date-fns'
import { useTranslation } from 'react-i18next'
import Balance, {
  CurrencyType,
  DataCredits,
  NetworkTokens,
} from '@helium/currency'
import { startCase } from 'lodash'
import TxnReceive from '@assets/images/txnReceive.svg'
import TxnSend from '@assets/images/txnSend.svg'
import shortLocale from '../../utils/formatDistance'
import { Color } from '../../theme/theme'
import { AccountActivity_accountActivity_data } from '../../graphql/__generated__/AccountActivity'
import { groupSeparator, decimalSeparator } from '../../utils/i18n'
import { useColors } from '../../theme/themeHooks'

export const TxnTypeKeys = [
  'rewards_v1',
  'rewards_v2',
  'payment_v1',
  'payment_v2',
  'add_gateway_v1',
  'assert_location_v1',
  'assert_location_v2',
  'transfer_hotspot_v1',
  'token_burn_v1',
  'unstake_validator_v1',
  'stake_validator_v1',
  'transfer_validator_stake_v1',
] as const
type TxnType = typeof TxnTypeKeys[number]

const useTxn = (
  item: AccountActivity_accountActivity_data,
  address: string,
  dateOpts?: { dateFormat?: string; now: Date },
) => {
  const colors = useColors()
  const { t } = useTranslation()

  const hntBalance = (v: number | undefined | null) =>
    new Balance(v || 0, CurrencyType.networkToken)

  const dcBalance = (v: number | undefined | null) =>
    new Balance(v || 0, CurrencyType.dataCredit)

  const isSending = useMemo(() => {
    return item.payer === address
  }, [address, item.payer])

  const isSelling = useMemo(() => {
    return item.seller === address
  }, [address, item.seller])

  const color = useMemo((): Color => {
    switch (item.type as TxnType) {
      case 'transfer_hotspot_v1':
      case 'add_gateway_v1':
        return 'orange500'
      case 'payment_v1':
      case 'payment_v2':
        return isSending ? 'blueBright500' : 'greenBright500'
      case 'assert_location_v1':
      case 'assert_location_v2':
        return 'orange500'
      case 'rewards_v1':
      case 'rewards_v2':
      case 'stake_validator_v1':
      case 'transfer_validator_stake_v1':
        return 'purple500'
      case 'token_burn_v1':
        return 'orange500'
      case 'unstake_validator_v1':
        return 'greenBright500'
      default:
        return 'primaryText'
    }
  }, [isSending, item])

  const title = useMemo(() => {
    if (!TxnTypeKeys.find((k) => k === item.type)) {
      return startCase(item.type)
    }

    switch (item.type as TxnType) {
      case 'add_gateway_v1':
        return t('transactions.added')
      case 'payment_v1':
      case 'payment_v2':
        return isSending ? t('transactions.sent') : t('transactions.received')
      case 'assert_location_v1':
        return t('transactions.location')
      case 'assert_location_v2':
        return t('transactions.location_v2')
      case 'transfer_hotspot_v1':
        return isSelling
          ? t('transactions.transferSell')
          : t('transactions.transferBuy')
      case 'rewards_v1':
      case 'rewards_v2':
        return t('transactions.mining')
      case 'token_burn_v1':
        return t('transactions.burnHNT')
      case 'stake_validator_v1':
        return t('transactions.stakeValidator')
      case 'unstake_validator_v1':
        return t('transactions.unstakeValidator')
      case 'transfer_validator_stake_v1':
        return t('transactions.transferValidator')
    }
  }, [isSending, isSelling, t, item])

  const detailIcon = useMemo(() => {
    // TODO: DetailIcon
    return isSending ? <TxnSend /> : <TxnReceive />
    // switch (item.type as TxnType) {
    // case 'stake_validator_v1':
    // case 'unstake_validator_v1':
    // case 'transfer_validator_stake_v1':
    //   return <TransferStakeValidator width={40} />
    // case 'transfer_hotspot_v1':
    //   return <HotspotTransfer height={20} width={50} />
    // case 'payment_v1':
    // case 'payment_v2':
    //   return isSending ? (
    //     <SentHnt width={35} height={24} />
    //   ) : (
    //     <ReceivedHnt width={35} height={24} />
    //   )
    // case 'assert_location_v1':
    // case 'assert_location_v2':
    //   return <Location width={20} height={23} color="white" />
    // case 'rewards_v1':
    // case 'rewards_v2':
    //   return <Rewards width={26} height={26} />
    // case 'token_burn_v1':
    //   return <Burn width={23} height={28} />
    // case 'add_gateway_v1':
    // default:
    //   return <HotspotAdded width={20} height={20} />
    // }
  }, [isSending])

  const listIcon = useMemo(() => {
    const iconColor = colors[color]
    switch (item.type as TxnType) {
      case 'stake_validator_v1':
        return <TxnSend color={iconColor} />
      case 'unstake_validator_v1':
        return <TxnReceive color={iconColor} />
      case 'transfer_validator_stake_v1':
        return <TxnReceive color={iconColor} />
      case 'payment_v1':
      case 'payment_v2':
        return isSending ? (
          <TxnSend color={iconColor} />
        ) : (
          <TxnReceive color={iconColor} />
        )
      case 'assert_location_v1':
      case 'assert_location_v2':
        return <TxnReceive color={iconColor} />
      case 'rewards_v1':
      case 'rewards_v2':
        return <TxnReceive color={iconColor} />
      case 'token_burn_v1':
        return <TxnSend color={iconColor} />
      case 'transfer_hotspot_v1':
      case 'add_gateway_v1':
      default:
        return <TxnReceive color={iconColor} />
    }
  }, [color, colors, isSending, item.type])

  const isFee = useMemo(() => {
    // // TODO: Determine if TransferStakeV1 is a fee
    const type = item.type as TxnType
    if (type === 'payment_v1' || type === 'payment_v2') {
      return isSending
    }

    if (
      type === 'rewards_v1' ||
      type === 'rewards_v2' ||
      type === 'unstake_validator_v1'
    ) {
      return false
    }

    if (type === 'transfer_hotspot_v1') {
      return item.seller === address
    }

    return true
  }, [address, isSending, item.seller, item.type])

  const formatAmount = useCallback(
    async (
      prefix: '-' | '+',
      amount?: Balance<DataCredits | NetworkTokens>,
    ): Promise<string> => {
      if (!amount) return ''

      if (amount?.floatBalance === 0) {
        return amount.toString(undefined, { groupSeparator, decimalSeparator })
      }

      // TODO: Convert between user currency and HNT
      // if (amount instanceof Balance && amount.type.ticker === 'HNT') {
      // const display = await hntBalanceToDisplayVal(amount, false, 8)
      // return `${prefix}${display}`
      // }

      return `${prefix}${amount?.toString(4, {
        groupSeparator,
        decimalSeparator,
      })}`
    },
    [],
  )

  const fee = useMemo(async () => {
    const type = item.type as TxnType
    if (type === 'rewards_v1' || type === 'rewards_v2') {
      return ''
    }

    if (type === 'transfer_hotspot_v1') {
      if (!isSelling) return ''

      return formatAmount('-', dcBalance(item.fee))
    }

    if (
      type === 'add_gateway_v1' ||
      type === 'assert_location_v1' ||
      type === 'assert_location_v2' ||
      type === 'token_burn_v1'
    ) {
      return formatAmount('-', dcBalance(item.fee))
    }

    if (type === 'payment_v1' || type === 'payment_v2') {
      if (address !== item.payer) return ''
      return formatAmount('-', dcBalance(item.fee))
    }

    return ''
  }, [address, formatAmount, isSelling, item.fee, item.payer, item.type])

  // const feePayer = useMemo(() => {
  //   if (
  //     item instanceof AddGatewayV1 ||
  //     item instanceof AssertLocationV1 ||
  //     item instanceof AssertLocationV2
  //   ) {
  //     return getMakerName(item.payer, makers)
  //   }
  //   return ''
  // }, [item])

  const amount = useCallback(() => {
    switch (item.type as TxnType) {
      case 'rewards_v1':
      case 'rewards_v2': {
        const rewardsAmount =
          item.rewards?.reduce(
            (sum, current) => sum.plus(hntBalance(current.amount)),
            hntBalance(0),
          ) || hntBalance(0)
        return formatAmount('+', rewardsAmount)
      }
      case 'transfer_hotspot_v1':
        return formatAmount(
          isSelling ? '+' : '-',
          hntBalance(item.amountToSeller),
        )
      case 'assert_location_v1':
      case 'assert_location_v2':
      case 'add_gateway_v1':
        return formatAmount('-', dcBalance(item.stakingFee))
      case 'stake_validator_v1':
        return formatAmount('-', hntBalance(item.stake))
      case 'unstake_validator_v1':
        return formatAmount('+', hntBalance(item.stakeAmount))
      case 'transfer_validator_stake_v1':
        return formatAmount(
          item.payer === address ? '-' : '+',
          hntBalance(item.stakeAmount),
        )
      case 'token_burn_v1':
        return formatAmount('-', hntBalance(item.amount))
      case 'payment_v1':
        return formatAmount(
          item.payer === address ? '-' : '+',
          hntBalance(item.amount),
        )
      case 'payment_v2': {
        if (item.payer === address) {
          const paymentTotal =
            item.payments?.reduce(
              (sum, current) => sum.plus(hntBalance(current.amount)),
              hntBalance(0),
            ) || hntBalance(0)
          return formatAmount('-', paymentTotal)
        }

        const payment = item.payments?.find((p) => p.payee === address)
        return formatAmount('+', hntBalance(payment?.amount))
      }
    }
  }, [
    address,
    formatAmount,
    isSelling,
    item.amount,
    item.amountToSeller,
    item.payer,
    item.payments,
    item.rewards,
    item.stake,
    item.stakeAmount,
    item.stakingFee,
    item.type,
  ])

  const time = useMemo(() => {
    // TODO: Handle Pending
    // const pending = item as PendingTransaction
    // if (pending.status === 'pending') {
    //   return t('transactions.pending')
    // }
    const val = fromUnixTime(item.time)

    if (!dateOpts?.dateFormat) {
      if (dateOpts?.now) {
        return formatDistance(val, dateOpts.now, {
          locale: shortLocale,
          addSuffix: true,
        })
      }
      return formatDistanceToNow(val, { locale: shortLocale, addSuffix: true })
    }
    return format(val, dateOpts.dateFormat)
  }, [dateOpts, item.time])

  const memo = useMemo(() => {
    return item.memo
    // TODO: memo
  }, [item.memo])

  return {
    memo,
    time,
    amount,
    fee,
    detailIcon,
    listIcon,
    title,
    color,
    isFee,
  }
}

export default useTxn
