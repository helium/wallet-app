// Lossless conversion between human-readable ("uiAmount") strings and raw
// integer-string balances. No floating point — mirrors on-chain integer math.

export const uiToRaw = (ui: string, decimals: number): string => {
  const trimmed = (ui ?? '').trim()
  if (!trimmed) return '0'
  // For 0-decimal mints, keep only the integer part — stripping non-digits
  // from "5.7" would yield "57", a 10x error on a funds-moving path.
  if (decimals === 0) return trimmed.split('.')[0].replace(/\D/g, '') || '0'
  const [intPart = '0', fracPart = ''] = trimmed.split('.')
  const paddedFrac = fracPart.slice(0, decimals).padEnd(decimals, '0')
  const raw = `${intPart}${paddedFrac}`.replace(/^0+/, '')
  return raw || '0'
}

export const rawToUi = (raw: string, decimals: number): string => {
  const digits = (raw ?? '0').replace(/^0+/, '') || '0'
  if (decimals === 0) return digits
  const padded = digits.padStart(decimals + 1, '0')
  const intPart = padded.slice(0, padded.length - decimals)
  const fracPart = padded.slice(padded.length - decimals).replace(/0+$/, '')
  return fracPart ? `${intPart}.${fracPart}` : intPart
}
