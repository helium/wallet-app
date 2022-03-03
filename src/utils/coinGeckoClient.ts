export type CoinGeckoPrices = Record<string, number>

export const getCurrentPrices = async () => {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/coins/helium?localization=false&tickers=false&community_data=false&developer_data=false',
  )
  const json = await response.json()
  if (json?.market_data?.current_price) {
    return json?.market_data?.current_price as CoinGeckoPrices
  }
  return undefined
}
