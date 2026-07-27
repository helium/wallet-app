import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'

// Mint addresses the migration backend supports. SOL/HNT/MOBILE/IOT/DC come from
// the canonical Helium/Solana constants; only USDC/USDT (not exported by those
// packages) stay as literals.
export const WSOL_MINT = NATIVE_MINT.toBase58()
const HNT = HNT_MINT.toBase58()
const MOBILE = MOBILE_MINT.toBase58()
const IOT = IOT_MINT.toBase58()
const DC = DC_MINT.toBase58()
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

export const MIGRATABLE_MINTS: ReadonlySet<string> = new Set([
  WSOL_MINT,
  USDC_MINT,
  USDT_MINT,
  HNT,
  MOBILE,
  IOT,
  DC,
])

// Maps a migratable mint to its coingecko key in redux `balances.tokenPrices`.
// Only mints we have a price feed for appear here (USDC/USDT/DC are omitted).
export const MINT_PRICE_KEY: Readonly<Record<string, string>> = {
  [WSOL_MINT]: 'solana',
  [HNT]: 'helium',
  [MOBILE]: 'helium-mobile',
  [IOT]: 'helium-iot',
}
