import BN from 'bn.js'
import { Mint } from '@solana/spl-token'
import { groupSeparator, decimalSeparator } from './i18n'

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
    groupSeparator,
  )
  const decimalPart =
    decimals !== 0
      ? input
          .slice(-decimals)
          .padStart(decimals, '0') // Add prefix zeros
          .replace(/0+$/, '') // Remove trailing zeros
      : ''

  return `${formattedIntegerPart.length > 0 ? formattedIntegerPart : '0'}${
    Number(decimalPart) !== 0 ? `${decimalSeparator}${decimalPart}` : ''
  }`
}

export const fmtTokenAmount = (c: BN, decimals?: number) =>
  c?.div(new BN(10).pow(new BN(decimals ?? 0))).toNumber() || 0

export const precision = (a: number) => {
  if (!Number.isFinite(a)) return 0
  let e = 1
  let p = 0
  while (Math.round(a * e) / e !== a) {
    e *= 10
    // eslint-disable-next-line no-plusplus
    p++
  }
  return p
}

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}
