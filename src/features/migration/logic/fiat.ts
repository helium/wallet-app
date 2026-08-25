import { MINT_PRICE_KEY } from './mints'
import { FiatEstimate, PriceMap, SelectableToken } from './types'

// Sums the selected amounts over the mints we can price and counts the rest,
// so an arbitrary token never silently shrinks the estimate.
export const estimateFiat = (args: {
  tokens: SelectableToken[]
  amounts: Record<string, string>
  prices?: PriceMap
  currency: string
}): FiatEstimate => {
  const { tokens, amounts, prices, currency } = args

  let total = 0
  let unpricedCount = 0

  tokens.forEach((tk) => {
    const amount = parseFloat(amounts[tk.mint] ?? '')
    if (!(amount > 0)) return

    const priceKey = MINT_PRICE_KEY[tk.mint]
    const price = priceKey ? prices?.[priceKey]?.[currency] : undefined
    if (price === undefined) unpricedCount += 1
    else total += price * amount
  })

  return { total, unpricedCount }
}
