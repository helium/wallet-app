import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'

// Mint addresses the migration flow prices. They come from the canonical
// Helium/Solana constants.
export const WSOL_MINT = NATIVE_MINT.toBase58()
const HNT = HNT_MINT.toBase58()
const MOBILE = MOBILE_MINT.toBase58()
const IOT = IOT_MINT.toBase58()

// Maps a migratable mint to its coingecko key in redux `balances.tokenPrices`.
// Only mints we have a price feed for appear here; every other token counts as
// unpriced.
export const MINT_PRICE_KEY: Readonly<Record<string, string>> = {
  [WSOL_MINT]: 'solana',
  [HNT]: 'helium',
  [MOBILE]: 'helium-mobile',
  [IOT]: 'helium-iot',
}
