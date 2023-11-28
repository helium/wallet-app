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

export const fmtUnixTime = (d: BN | number) => {
  const currentTimestamp = Math.floor(Date.now() / 1000) // Current Unix timestamp in seconds
  const targetTimestamp = typeof d === 'number' ? d : d.toNumber()
  const difference = targetTimestamp - currentTimestamp

  if (difference <= 0) {
    const absoluteDifference = Math.abs(difference)

    if (absoluteDifference < 60) {
      return `${absoluteDifference} second${
        absoluteDifference > 1 ? 's' : ''
      } ago`
    }

    if (absoluteDifference < 3600) {
      const minutes = Math.floor(absoluteDifference / 60)
      return [minutes, `minute${minutes > 1 ? 's' : ''}`, 'ago'].join(' ')
    }

    if (absoluteDifference < 86400) {
      const hours = Math.floor(absoluteDifference / 3600)
      const remainingMinutes = Math.floor((absoluteDifference % 3600) / 60)
      const hoursText = [hours, `hour${hours > 1 ? 's' : ''}`].join(' ')
      const minutesText = [
        remainingMinutes,
        `minute${remainingMinutes > 1 ? 's' : ''}`,
      ].join(' ')

      return [
        hoursText,
        remainingMinutes > 0 ? `and ${minutesText}` : '',
        'ago',
      ].join(' ')
    }

    const days = Math.floor(absoluteDifference / 86400)
    const remainingHours = Math.floor((absoluteDifference % 86400) / 3600)
    const daysText = [days, `day${days > 1 ? 's' : ''}`].join(' ')
    const hoursText = [
      remainingHours,
      `hour${remainingHours > 1 ? 's' : ''}`,
    ].join(' ')

    return [daysText, remainingHours > 0 ? `and ${hoursText}` : '', 'ago'].join(
      ' ',
    )
  }

  if (difference < 60) {
    return `${difference} second${difference > 1 ? 's' : ''} from now`
  }

  if (difference < 3600) {
    const minutes = Math.floor(difference / 60)
    return [minutes, `minute${minutes > 1 ? 's' : ''}`, 'from now'].join(' ')
  }

  if (difference < 86400) {
    const hours = Math.floor(difference / 3600)
    const remainingMinutes = Math.floor((difference % 3600) / 60)
    const hoursText = [hours, `hour${hours > 1 ? 's' : ''}`].join(' ')
    const minutesText = [
      remainingMinutes,
      `minute${remainingMinutes > 1 ? 's' : ''}`,
    ].join(' ')

    return [
      hoursText,
      remainingMinutes > 0 ? `and ${minutesText}` : '',
      'from now',
    ].join(' ')
  }

  const days = Math.floor(difference / 86400)
  const remainingHours = Math.floor((difference % 86400) / 3600)
  const daysText = [days, `day${days > 1 ? 's' : ''}`].join(' ')
  const hoursText = [
    remainingHours,
    `hour${remainingHours > 1 ? 's' : ''}`,
  ].join(' ')

  return [
    daysText,
    remainingHours > 0 ? `and ${hoursText}` : '',
    'from now',
  ].join(' ')
}
