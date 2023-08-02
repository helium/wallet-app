import TxnReceive from '@assets/images/txnReceive.svg'
import TxnSend from '@assets/images/txnSend.svg'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Color } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import animalName from 'angry-purple-tiger'
import {
  addMinutes,
  format,
  formatDistance,
  formatDistanceToNow,
  fromUnixTime,
} from 'date-fns'
import { startCase } from 'lodash'
import React, { useCallback, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { Activity } from '../../types/activity'
import { ellipsizeAddress } from '../../utils/accountUtils'
import shortLocale from '../../utils/formatDistance'
import { TXN_FEE_IN_LAMPORTS } from '../../utils/solanaUtils'
import { useOnboarding } from '../onboarding/OnboardingProvider'

export const TxnTypeKeys = ['payment_v2', 'dc_delegate', 'dc_mint'] as const
type TxnType = typeof TxnTypeKeys[number]

const useTxn = (
  item?: Activity,
  dateOpts?: { dateFormat?: string; now?: Date },
) => {
  const { currentNetworkAddress: address } = useAccountStorage()
  const colors = useColors()
  const { t } = useTranslation()
  const { makers } = useOnboarding()
  const { symbol: ticker } = useMetaplexMetadata(
    usePublicKey(item?.payments?.[0]?.mint || undefined),
  )

  const isSending = useMemo(() => {
    return item?.payer === address
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
      case 'payment_v2':
        return isSending ? 'blueBright500' : 'greenBright500'
      case 'dc_mint':
        return 'greenBright500'
      case 'dc_delegate':
        return 'orange500'
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
        case 'payment_v2':
          if (!isSending) return ''
          return t('transactions.pending.sending')
      }
    }
    switch (item?.type as TxnType) {
      case 'payment_v2': {
        if (item?.payments?.length) {
          const firstPaymentTokenType = item.payments[0].mint
          const hasMixedTokenTypes = item.payments.find(
            (p) => p.mint !== firstPaymentTokenType,
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
      case 'dc_delegate':
        return t('transactions.delegated')
      case 'dc_mint':
        return t('transactions.received', { ticker: '' })
    }
  }, [item, t, isSending, ticker])

  const listIcon = useMemo(() => {
    const iconColor = colors[color]
    switch (item?.type as TxnType) {
      case 'payment_v2':
        return isSending ? (
          <TxnSend color={iconColor} />
        ) : (
          <TxnReceive color={iconColor} />
        )
      case 'dc_delegate':
      case 'dc_mint':
      default:
        return <TxnReceive color={iconColor} />
    }
  }, [color, colors, isSending, item])

  const isFee = useMemo(() => {
    // // TODO: Determine if TransferStakeV1 is a fee
    const type = item?.type as TxnType
    if (type === 'payment_v2') {
      return isSending
    }

    return true
  }, [isSending, item])

  const formatAmount = useCallback(
    (prefix: '-' | '+' | '', amount?: number) => {
      if (!amount) return ''

      return `${prefix}${amount.toFixed(4)}`
    },
    [],
  )

  const getFee = useCallback(async () => {
    return formatAmount('-', TXN_FEE_IN_LAMPORTS / LAMPORTS_PER_SOL)
  }, [formatAmount])

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
    if (!item) return ''
    switch (item.type as TxnType) {
      default:
        return ''
    }
  }, [item])

  const getAmount = useCallback(() => {
    if (!item) return ''

    switch (item.type as TxnType) {
      case 'dc_delegate':
        return formatAmount('-', Number(item.amount))
      case 'dc_mint':
        return formatAmount('+', Number(item.amount))
      case 'payment_v2': {
          const paymentTotals = item.payments?.reduce((sums, current) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const mint = (current.mint || item.payments?.[0].mint)!
            return {
              ...sums,
              [mint]: (sums[mint] || 0) + current.amount,
            }
          }, {} as Record<string, number>)
          if (!paymentTotals) return ''
          return Object.keys(paymentTotals)
            .flatMap((m) => {
              const total = paymentTotals[m]
              if (total === 0) return []
              const amt = formatAmount('', paymentTotals[m])
              return [amt]
            })
            .join(', ')
        }

        return `+${item.payments
          ?.filter((p) => p.payee === address)
          .map((p) => formatAmount('', p.amount))
          .join(', ')}`
      }
    }

    return ''
  }, [item, formatAmount, address])

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

  const getPaymentsReceived = useCallback(async () => {
    const payments = item?.payments?.filter(({ payee }) => payee === address)
    if (!payments) return []
    const all = payments.map(async (p) => {
      const balance = await formatAmount('+', p.amount)
      return { amount: balance, payee: p.payee, memo: p.memo || '' }
    })
    return Promise.all(all)
  }, [address, formatAmount, item])

  const getPaymentsSent = useCallback(async () => {
    if (item?.payer !== address || !item?.payments) {
      return []
    }
    const all = item.payments.map(
      async ({ amount: amt, payee, memo: paymentMemo }) => {
        const balance = await formatAmount('', amt)
        return { amount: balance, payee, memo: paymentMemo || '' }
      },
    )

    return Promise.all(all)
  }, [address, formatAmount, item])

  return {
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
