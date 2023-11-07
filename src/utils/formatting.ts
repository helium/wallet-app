import BN from 'bn.js'
import { Mint } from '@solana/spl-token'

export const getMintMinAmountAsDecimal = (mint: Mint) => {
  return 1 * 10 ** -mint.decimals
}

export const calculatePct = (c = new BN(0), total?: BN) => {
  if (total?.isZero()) {
    return 0
  }

  return new BN(100)
    .mul(c)
    .div(total ?? new BN(1))
    .toNumber()
}

const getSeparator = (separatorType: 'group' | 'decimal') => {
  const numberWithGroupAndDecimalSeparator = 1000.1
  const parts = Intl.NumberFormat().formatToParts(
    numberWithGroupAndDecimalSeparator,
  )
  const part = parts.find((p) => p.type === separatorType)
  return part ? part.value : ''
}

export const humanReadable = (
  amount?: BN,
  decimals?: number,
): string | undefined => {
  if (typeof decimals === 'undefined' || typeof amount === 'undefined') return

  const input = amount.toString()
  const integerPart =
    input.length > decimals ? input.slice(0, input.length - decimals) : ''
  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    getSeparator('group'),
  )
  const decimalPart =
    decimals !== 0
      ? input
          .slice(-decimals)
          .padStart(decimals, '0') // Add prefix zeros
          .replace(/0+$/, '') // Remove trailing zeros
      : ''

  return `${formattedIntegerPart.length > 0 ? formattedIntegerPart : '0'}${
    Number(decimalPart) !== 0 ? `${getSeparator('decimal')}${decimalPart}` : ''
  }`
}

export const fmtTokenAmount = (c: BN, decimals?: number) =>
  c?.div(new BN(10).pow(new BN(decimals ?? 0))).toNumber() || 0

export const fmtUnixTime = (d: BN | number) => {
  const currentTimestamp = Math.floor(Date.now() / 1000) // Current Unix timestamp in seconds
  const difference =
    currentTimestamp - (typeof d === 'number' ? d : d.toNumber())

  if (difference < 60) {
    return `${difference} seconds ago`
  }
  if (difference < 3600) {
    const minutes = Math.floor(difference / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }
  if (difference < 86400) {
    const hours = Math.floor(difference / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  const days = Math.floor(difference / 86400)
  return `${days} day${days > 1 ? 's' : ''} ago`
}
