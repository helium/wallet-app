import React, { useCallback, useMemo, useState } from 'react'
import {
  addMinutes,
  format,
  formatDistance,
  formatDistanceToNow,
  fromUnixTime,
} from 'date-fns'
import { useTranslation } from 'react-i18next'
import Balance, {
  AnyCurrencyType,
  CurrencyType,
  Ticker,
} from '@helium/currency'
import { startCase } from 'lodash'
import TxnReceive from '@assets/images/txnReceive.svg'
import TxnSend from '@assets/images/txnSend.svg'
import { useAsync } from 'react-async-hook'
import animalName from 'angry-purple-tiger'
import shortLocale from '../../utils/formatDistance'
import { Color } from '../../theme/theme'
import { useColors } from '../../theme/themeHooks'
import { accountCurrencyType, ellipsizeAddress } from '../../utils/accountUtils'
import { balanceToString, useBalance } from '../../utils/Balance'
import { decodeMemoString, DEFAULT_MEMO } from '../../components/MemoInput'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { TXN_FEE_IN_LAMPORTS } from '../../utils/solanaUtils'
import { Activity } from '../../types/activity'

export const TxnTypeKeys = [
  'rewards_v1',
  'rewards_v2',
  'payment_v1',
  'payment_v2',
  'add_gateway_v1',
  'assert_location_v1',
  'assert_location_v2',
  'transfer_hotspot_v1',
  'transfer_hotspot_v2',
  'token_burn_v1',
  'unstake_validator_v1',
  'stake_validator_v1',
  'transfer_validator_stake_v1',
  'subnetwork_rewards_v1',
] as const
type TxnType = typeof TxnTypeKeys[number]

const useTxn = (
  item?: Activity,
  dateOpts?: { dateFormat?: string; now?: Date },
) => {
  const { currentNetworkAddress: address } = useAccountStorage()
  const { l1Network } = useAppStorage()
  const colors = useColors()
  const { bonesToBalance } = useBalance()
  const { t } = useTranslation()
  const { makers } = useOnboarding()

  const ticker = useMemo(() => {
    // Get the ticker from the item if it's available
    if (item?.payments?.length) {
      const firstPaymentTokenType = item.payments[0].tokenType
      if (firstPaymentTokenType) {
        return accountCurrencyType(address, firstPaymentTokenType).ticker
      }
    }
    return accountCurrencyType(address).ticker
  }, [address, item])

  const dcBalance = (v: number | undefined | null) =>
    new Balance(v || 0, CurrencyType.dataCredit)

  const isSending = useMemo(() => {
    return item?.payer === address
  }, [address, item])

  const isSelling = useMemo(() => {
    if (item?.seller) return item?.seller === address // for transfer_v1
    if (item?.owner) return item?.owner === address // transfer_v2
    return false
  }, [address, item])

  const isHotspotTxn = useMemo(
    () =>
      item?.type === 'assert_location_v1' ||
      item?.type === 'assert_location_v2' ||
      item?.type === 'add_gateway_v1' ||
      item?.type === 'transfer_hotspot_v1' ||
      item?.type === 'transfer_hotspot_v2',
    [item],
  )

  const isValidatorTxn = useMemo(
    () =>
      item?.type === 'stake_validator_v1' ||
      item?.type === 'transfer_validator_stake_v1' ||
      item?.type === 'unstake_validator_v1',
    [item],
  )

  const getHotspotName = useCallback(() => {
    if (!isHotspotTxn || !item?.gateway) return ''
    return animalName(item.gateway)
  }, [isHotspotTxn, item])

  const getValidatorName = useCallback(() => {
    if (!isValidatorTxn || !item?.address) return ''
    return animalName(item.address)
  }, [isValidatorTxn, item])

  const color = useMemo((): Color => {
    switch (item?.type as TxnType) {
      case 'transfer_hotspot_v1':
      case 'transfer_hotspot_v2':
        return 'orange500'
      case 'payment_v1':
      case 'payment_v2':
        return isSending ? 'blueBright500' : 'greenBright500'
      case 'add_gateway_v1':
      case 'assert_location_v1':
      case 'assert_location_v2':
        return 'greenBright500'
      case 'subnetwork_rewards_v1':
      case 'rewards_v1':
      case 'rewards_v2':
      case 'stake_validator_v1':
      case 'transfer_validator_stake_v1':
        return 'greenBright500'
      case 'token_burn_v1':
        return 'orange500'
      case 'unstake_validator_v1':
        return 'greenBright500'
      default:
        return 'primaryText'
    }
  }, [isSending, item])

  const title = useMemo(() => {
    if (!TxnTypeKeys.find((k) => k === item?.type)) {
      return startCase(item?.type)
    }

    if (item?.pending) {
      switch (item.type as TxnType) {
        case 'payment_v1':
        case 'payment_v2':
          if (!isSending) return ''
          return t('transactions.pending.sending')
      }
    }
    switch (item?.type as TxnType) {
      case 'add_gateway_v1':
        return t('transactions.added')
      case 'payment_v1':
      case 'payment_v2': {
        if (item?.payments?.length) {
          const firstPaymentTokenType = item.payments[0].tokenType
          const hasMixedTokenTypes = item.payments.find(
            (p) => p.tokenType !== firstPaymentTokenType,
          )
          if (hasMixedTokenTypes) {
            return isSending
              ? t('transactions.sent', { ticker: t('transactions.tokens') })
              : t('transactions.received', { ticker: t('transactions.tokens') })
          }
        }
        return isSending
          ? t('transactions.sent', { ticker })
          : t('transactions.received', { ticker })
      }
      case 'assert_location_v1':
        return t('transactions.location')
      case 'assert_location_v2':
        return t('transactions.location_v2')
      case 'transfer_hotspot_v1':
      case 'transfer_hotspot_v2':
        return isSelling
          ? t('transactions.transferSell')
          : t('transactions.transferBuy')
      case 'rewards_v1':
      case 'rewards_v2':
        return t('transactions.mining')
      case 'token_burn_v1':
        return t('transactions.burnHNT', { ticker })
      case 'stake_validator_v1':
        return t('transactions.stakeValidator', { ticker })
      case 'unstake_validator_v1':
        return t('transactions.unstakeValidator', { ticker })
      case 'transfer_validator_stake_v1':
        return t('transactions.transferValidator')
      case 'subnetwork_rewards_v1':
        return item?.tokenType === 'IOT'
          ? t('transactions.iotRewards')
          : t('transactions.mobileRewards')
    }
  }, [item, t, isSending, ticker, isSelling])

  const listIcon = useMemo(() => {
    const iconColor = colors[color]
    switch (item?.type as TxnType) {
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
      case 'transfer_hotspot_v2':
      case 'add_gateway_v1':
      default:
        return <TxnReceive color={iconColor} />
    }
  }, [color, colors, isSending, item])

  const isFee = useMemo(() => {
    // // TODO: Determine if TransferStakeV1 is a fee
    const type = item?.type as TxnType
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

    if (type === 'transfer_hotspot_v1' || type === 'transfer_hotspot_v2') {
      return isSelling
    }

    return true
  }, [isSelling, isSending, item])

  const formatAmount = useCallback(
    (prefix: '-' | '+' | '', amount?: Balance<AnyCurrencyType>) => {
      if (!amount) return ''

      if (amount?.floatBalance === 0) {
        return balanceToString(amount)
      }

      return `${prefix}${balanceToString(amount, { maxDecimalPlaces: 4 })}`
    },
    [],
  )

  const getFee = useCallback(async () => {
    if (l1Network === 'solana') {
      return formatAmount(
        '-',
        new Balance(TXN_FEE_IN_LAMPORTS, CurrencyType.solTokens),
      )
    }
    const type = item?.type as TxnType
    if (type === 'rewards_v1' || type === 'rewards_v2') {
      return ''
    }

    if (type === 'transfer_hotspot_v1' || type === 'transfer_hotspot_v2') {
      if (!isSelling) return ''

      return formatAmount('-', dcBalance(item?.fee))
    }

    if (
      type === 'add_gateway_v1' ||
      type === 'assert_location_v1' ||
      type === 'assert_location_v2' ||
      type === 'token_burn_v1' ||
      type === 'stake_validator_v1' ||
      type === 'unstake_validator_v1' ||
      type === 'transfer_validator_stake_v1'
    ) {
      return formatAmount('-', dcBalance(item?.fee))
    }

    if (type === 'payment_v1' || type === 'payment_v2') {
      if (address !== item?.payer) return ''
      return formatAmount('-', dcBalance(item?.fee))
    }

    return ''
  }, [address, formatAmount, isSelling, item, l1Network])

  const getFeePayer = useCallback(() => {
    const type = item?.type
    if (
      !item?.type ||
      !item.payer ||
      (type !== 'add_gateway_v1' &&
        type !== 'assert_location_v1' &&
        type !== 'assert_location_v2')
    ) {
      return ''
    }
    return (
      makers.find(({ address: makerAddress }) => makerAddress === item.payer)
        ?.name || ellipsizeAddress(item.payer)
    )
  }, [item, makers])

  const getAmountTitle = useCallback(async () => {
    const feePayer = await getFeePayer()
    if (!item) return ''
    switch (item.type as TxnType) {
      case 'transfer_hotspot_v1':
        return t('transactions.amountToSeller')
      case 'assert_location_v1':
      case 'assert_location_v2':
      case 'add_gateway_v1':
        return t('transactions.feePaidBy', { feePayer })
      case 'stake_validator_v1':
        return t('transactions.stake')
      case 'transfer_validator_stake_v1':
      case 'unstake_validator_v1':
        return t('transactions.stakeAmount')
      case 'token_burn_v1':
      case 'subnetwork_rewards_v1':
        return t('transactions.amount')
      case 'payment_v1':
      case 'payment_v2':
      case 'rewards_v1':
      case 'rewards_v2': {
        return t('transactions.totalAmount')
      }
      default:
        return ''
    }
  }, [getFeePayer, item, t])

  const getAmount = useCallback(() => {
    if (!item) return ''

    switch (item.type as TxnType) {
      case 'rewards_v1':
      case 'rewards_v2': {
        const rewardsAmount =
          item.rewards?.reduce(
            (sum, current) => sum.plus(bonesToBalance(current.amount, 'HNT')),
            bonesToBalance(0, 'HNT'),
          ) || bonesToBalance(0, 'HNT')
        return formatAmount('+', rewardsAmount)
      }
      case 'subnetwork_rewards_v1': {
        const { tokenType } = item
        const tick = (tokenType?.toUpperCase() || 'MOBILE') as Ticker
        const rewardsAmount =
          item.rewards?.reduce((sum, current) => {
            if (current.account !== address) return sum
            return sum.plus(bonesToBalance(current.amount, tick))
          }, bonesToBalance(0, tick)) || bonesToBalance(0, tick)
        return formatAmount('+', rewardsAmount)
      }
      case 'transfer_hotspot_v1':
        return formatAmount(
          isSelling ? '+' : '-',
          bonesToBalance(item.amountToSeller, 'HNT'),
        )
      case 'assert_location_v1':
      case 'assert_location_v2':
      case 'add_gateway_v1':
        return formatAmount('-', dcBalance(item.stakingFee))
      case 'stake_validator_v1':
        return formatAmount('-', bonesToBalance(item.stake, 'HNT'))
      case 'unstake_validator_v1':
        return formatAmount('-', bonesToBalance(item.stakeAmount, 'HNT'))
      case 'transfer_validator_stake_v1':
        return formatAmount(
          item.payer === address ? '-' : '+',
          bonesToBalance(item.stakeAmount, 'HNT'),
        )
      case 'token_burn_v1':
        return formatAmount('-', bonesToBalance(item.amount, 'HNT'))
      case 'payment_v1':
        return formatAmount('', bonesToBalance(item.amount, 'HNT'))
      case 'payment_v2': {
        if (item.payer === address) {
          const paymentTotals = item.payments?.reduce(
            (sums, current) => {
              const tokenType = (current.tokenType?.toUpperCase() ||
                'HNT') as Ticker
              return {
                ...sums,
                [tokenType]: sums[tokenType].plus(
                  bonesToBalance(current.amount, tokenType),
                ),
              }
            },
            {
              HNT: bonesToBalance(0, 'HNT'),
              IOT: bonesToBalance(0, 'IOT'),
              MOBILE: bonesToBalance(0, 'MOBILE'),
            } as Record<Ticker, Balance<AnyCurrencyType>>,
          )
          if (!paymentTotals) return ''
          return Object.keys(paymentTotals)
            .flatMap((p) => {
              const tick = p.toUpperCase() as Ticker
              const total = paymentTotals[tick]
              if (total.integerBalance === 0) return []
              const amt = formatAmount('', paymentTotals[tick])
              return [amt]
            })
            .join(', ')
        }

        return `+${item.payments
          ?.filter((p) => p.payee === address)
          .map((p) =>
            formatAmount(
              '',
              bonesToBalance(p.amount, p.tokenType?.toUpperCase() as Ticker),
            ),
          )
          .join(', ')}`
      }
    }

    return ''
  }, [item, formatAmount, isSelling, bonesToBalance, address])

  const time = useMemo(() => {
    if (!item) return ''

    if (!item.time) {
      if (item.pending) {
        return t('transactions.pending.inProcess')
      }
      return ''
    }
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

    // Format is in utc
    return `${format(
      addMinutes(val, val.getTimezoneOffset()),
      dateOpts.dateFormat,
    )} UTC`
  }, [dateOpts, item, t])

  const memo = useMemo(() => {
    let memoRaw = item?.memo
    const receivedPayment = item?.payments?.find((p) => p.payee === address)
    if (receivedPayment) {
      memoRaw = receivedPayment.memo
    } else if (item?.payments?.length) {
      memoRaw = item.payments.find((p) => !!p.memo)?.memo || ''
    }
    if (memoRaw === DEFAULT_MEMO) {
      return ''
    }

    return decodeMemoString(memoRaw)
  }, [address, item])

  const getPaymentsReceived = useCallback(async () => {
    const payments = item?.payments?.filter(({ payee }) => payee === address)
    if (!payments) return []
    const all = payments.map(async (p) => {
      const balance = await formatAmount(
        '+',
        bonesToBalance(p.amount, p.tokenType?.toUpperCase() as Ticker),
      )
      return { amount: balance, payee: p.payee, memo: p.memo || '' }
    })
    return Promise.all(all)
  }, [address, formatAmount, item, bonesToBalance])

  const getPaymentsSent = useCallback(async () => {
    if (item?.payer !== address || !item?.payments) {
      return []
    }
    const all = item.payments.map(
      async ({ amount: amt, payee, memo: paymentMemo, tokenType }) => {
        const balance = await formatAmount(
          '',
          bonesToBalance(amt, tokenType?.toUpperCase() as Ticker),
        )
        return { amount: balance, payee, memo: paymentMemo || '' }
      },
    )

    return Promise.all(all)
  }, [address, formatAmount, item, bonesToBalance])

  return {
    memo,
    time,
    getAmount,
    getFee,
    listIcon,
    title,
    color,
    isFee,
    getFeePayer,
    getPaymentsReceived,
    getPaymentsSent,
    isHotspotTxn,
    isValidatorTxn,
    getHotspotName,
    getValidatorName,
    getAmountTitle,
  }
}

type Payment = {
  amount: string
  payee: string
  memo: string
}
type TxnDetails = {
  feePayer: string
  icon?: JSX.Element
  title: string
  time: string
  color: Color
  fee: string
  paymentsReceived: Payment[]
  paymentsSent: Payment[]
  amount: string
  amountTitle: string
  hotspotName: string
  validatorName: string
  isValidatorTxn: boolean
  isHotspotTxn: boolean
}
export const useTxnDetails = (item?: Activity) => {
  const {
    listIcon,
    title,
    time,
    color,
    getFeePayer,
    getFee,
    getPaymentsReceived,
    getPaymentsSent,
    getAmount,
    getHotspotName,
    getValidatorName,
    isHotspotTxn,
    isValidatorTxn,
    getAmountTitle,
  } = useTxn(item, {
    dateFormat: 'dd MMMM yyyy HH:MM',
  })

  const [details, setDetails] = useState<TxnDetails>({
    feePayer: '',
    title: '',
    time: '',
    color: 'primaryText',
    fee: '',
    paymentsReceived: [],
    paymentsSent: [],
    amount: '',
    amountTitle: '',
    validatorName: '',
    hotspotName: '',
    isHotspotTxn: false,
    isValidatorTxn: false,
  })

  useAsync(async () => {
    const feePayer = await getFeePayer()
    const fee = await getFee()
    const paymentsReceived = await getPaymentsReceived()
    const paymentsSent = await getPaymentsSent()
    const amount = await getAmount()
    const amountTitle = await getAmountTitle()
    const validatorName = await getValidatorName()
    const hotspotName = await getHotspotName()

    setDetails({
      feePayer,
      icon: listIcon,
      title,
      time,
      color,
      fee,
      paymentsReceived,
      paymentsSent,
      amount,
      amountTitle,
      validatorName,
      hotspotName,
      isHotspotTxn,
      isValidatorTxn,
    })
  }, [
    color,
    getAmount,
    getFee,
    getFeePayer,
    getPaymentsReceived,
    getPaymentsSent,
    listIcon,
    time,
    title,
  ])
  return details
}

export default useTxn
