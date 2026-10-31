import { useAccounts } from '@helium/account-fetch-cache-hooks'
import { truthy } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import {
  METADATA_PARSER,
  getMetadataId,
  useMetaplexMetadata,
} from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { Mint, unpackMint } from '@solana/spl-token'
import { AccountInfo, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import {
  addMinutes,
  format,
  formatDistance,
  formatDistanceToNow,
  fromUnixTime,
} from 'date-fns'
import { startCase } from 'lodash'
import { CircleMinus, CirclePlus } from 'lucide-react-native'
import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { withUniwind } from 'uniwind'
import { Activity } from '../../types/activity'
import shortLocale from '../../utils/formatDistance'
import { TXN_FEE_IN_LAMPORTS, humanReadable } from '../../utils/solanaUtils'

const TxnSend = withUniwind(CircleMinus)
const TxnReceive = withUniwind(CirclePlus)

// A transaction's text colour class and the matching icon colour class.
const TXN_COLORS = {
  send: { text: 'text-blue-dark-500', icon: 'accent-blue-dark-500' },
  receive: { text: 'text-success-500', icon: 'accent-success-500' },
  other: { text: 'text-foreground', icon: 'accent-foreground' },
} as const
type TxnColor = (typeof TXN_COLORS)[keyof typeof TXN_COLORS]['text']

export const MintParser = (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
  const data = unpackMint(pubKey, info)

  return data
}

export const TxnTypeKeys = ['payment_v2'] as const
type TxnType = (typeof TxnTypeKeys)[number]

const useTxn = (
  mint?: PublicKey,
  item?: Activity,
  dateOpts?: { dateFormat?: string; now?: Date },
) => {
  const { t } = useTranslation()
  const { symbol: ticker } = useMetaplexMetadata(
    usePublicKey(item?.payments?.[0]?.mint || undefined),
  )
  const wallet = useCurrentWallet()
  const mintKeys = useMemo(
    () =>
      [...new Set(item?.payments?.map((p) => p.mint))]
        .filter(truthy)
        .map((k) => new PublicKey(k)),
    [item?.payments],
  )
  const metadataKeys = useMemo(
    () => mintKeys.map((m) => getMetadataId(m)),
    [mintKeys],
  )
  const { accounts: mintAccs } = useAccounts(mintKeys, MintParser)
  const { accounts: metadataAccs } = useAccounts(
    metadataKeys,
    METADATA_PARSER,
    true,
  )
  const decimalsByMint = useMemo(() => {
    return mintAccs?.reduce(
      (acc, curr) => {
        if (curr.info) {
          acc[curr.publicKey.toBase58()] = (curr.info as Mint).decimals
        }
        return acc
      },
      {} as { [key: string]: number },
    )
  }, [mintAccs])

  const symbolsByMint = useMemo(() => {
    return metadataAccs?.reduce(
      (acc, curr, index) => {
        if (curr.info && mintKeys[index]) {
          acc[mintKeys[index].toBase58()] = curr.info.data.symbol
        }
        return acc
      },
      {} as { [key: string]: string },
    )
  }, [metadataAccs, mintKeys])

  const isSending = useMemo(() => {
    return item?.payments?.some(
      (p) =>
        p.owner === wallet?.toBase58() &&
        p.amount < 0 &&
        p.mint === mint?.toBase58(),
    )
  }, [item?.payments, mint, wallet])

  const colorKey = useMemo((): keyof typeof TXN_COLORS => {
    switch (item?.type as TxnType) {
      case 'payment_v2':
        return isSending ? 'send' : 'receive'
      default:
        return 'other'
    }
  }, [isSending, item])
  const color: TxnColor = TXN_COLORS[colorKey].text

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
    }
  }, [item, t, isSending, ticker])

  const listIcon = useMemo(() => {
    const iconColor = TXN_COLORS[colorKey].icon
    switch (item?.type as TxnType) {
      case 'payment_v2':
        return isSending ? (
          <TxnSend size={20} colorClassName={iconColor} />
        ) : (
          <TxnReceive size={20} colorClassName={iconColor} />
        )
      default:
        return <TxnReceive size={20} colorClassName={iconColor} />
    }
  }, [colorKey, isSending, item])

  const isFee = useMemo(() => {
    // // TODO: Determine if TransferStakeV1 is a fee
    const type = item?.type as TxnType
    if (type === 'payment_v2') {
      return isSending
    }

    return true
  }, [isSending, item])

  const formatAmount = useCallback(
    (
      prefix: '-' | '+' | '',
      amount: number | undefined,
      m: string | undefined | null,
    ) => {
      const decimals = m ? decimalsByMint?.[m] : undefined
      if (!amount || typeof decimals === 'undefined') return ''
      const symbolPart = m ? symbolsByMint?.[m] || '' : ''

      return `${prefix}${humanReadable(
        new BN(
          Math.abs(amount)
            .toFixed(decimals || 0)
            .replace('.', ''),
        ),
        decimals,
      )} ${symbolPart}`
    },
    [decimalsByMint, symbolsByMint],
  )

  const getFee = useCallback(async () => {
    return `-${TXN_FEE_IN_LAMPORTS / LAMPORTS_PER_SOL}`
  }, [])

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
      case 'payment_v2': {
        const payment = item.payments?.find(
          (p) => p.mint === mint?.toBase58() && p.owner === wallet?.toBase58(),
        )
        if (payment) {
          return formatAmount(
            payment.amount < 0 ? '-' : '+',
            Math.abs(payment.amount),
            payment.mint,
          )
        }
      }
    }

    return ''
  }, [item, formatAmount, mint, wallet])

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
    const payments = item?.payments?.filter(
      ({ owner, amount }) => owner === wallet?.toBase58() && amount > 0,
    )
    if (!payments) return []
    const all = payments.map(async (p) => {
      const balance = formatAmount('+', p.amount, p.mint)
      return { amount: balance, owner: p.owner, memo: p.memo || '' }
    })
    return Promise.all(all)
  }, [formatAmount, item?.payments, wallet])

  const getPaymentsSent = useCallback(async () => {
    if (!item?.payments) {
      return []
    }
    const all = item.payments
      .filter((p) => p.amount < 0 && p.owner === wallet?.toBase58())
      .map(async ({ amount: amt, owner, memo: paymentMemo, mint: m }) => {
        const balance = formatAmount('', amt, m)
        return { amount: balance, owner, memo: paymentMemo || '' }
      })

    return Promise.all(all)
  }, [formatAmount, item, wallet])

  return {
    time,
    getAmount,
    getFee,
    listIcon,
    title,
    color,
    isFee,
    getPaymentsReceived,
    getPaymentsSent,
    getAmountTitle,
  }
}

type Payment = {
  amount: string
  owner: string
  memo: string
}
type TxnDetails = {
  feePayer: string
  icon?: React.JSX.Element
  title: string
  time: string
  color: TxnColor
  fee: string
  paymentsReceived: Payment[]
  paymentsSent: Payment[]
  amount: string
  amountTitle: string
}
export const useTxnDetails = (mint?: PublicKey, item?: Activity) => {
  const {
    listIcon,
    title,
    time,
    color,
    getFee,
    getPaymentsReceived,
    getPaymentsSent,
    getAmount,
    getAmountTitle,
  } = useTxn(mint, item, {
    dateFormat: 'dd MMMM yyyy HH:MM',
  })

  const [details, setDetails] = useState<TxnDetails>({
    feePayer: '',
    title: '',
    time: '',
    color: TXN_COLORS.other.text,
    fee: '',
    paymentsReceived: [],
    paymentsSent: [],
    amount: '',
    amountTitle: '',
  })

  const loadDetails = useEffectEvent(async (isCurrent: () => boolean) => {
    const fee = await getFee()
    const paymentsReceived = await getPaymentsReceived()
    const paymentsSent = await getPaymentsSent()
    const amount = getAmount()
    const amountTitle = await getAmountTitle()
    if (!isCurrent()) return

    setDetails({
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      feePayer: item?.feePayer!,
      icon: listIcon,
      title,
      time,
      color,
      fee,
      paymentsReceived,
      paymentsSent,
      amount,
      amountTitle,
    })
  })
  useEffect(() => {
    let current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sets the details after the async fee and payment lookups resolve
    loadDetails(() => current).catch((e) => console.error(e))
    return () => {
      current = false
    }
  }, [
    color,
    getAmount,
    getFee,
    getPaymentsReceived,
    getPaymentsSent,
    listIcon,
    time,
    title,
  ])
  return details
}

export default useTxn
