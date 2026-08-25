import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'

// Pure derivation of the account token list. Kept free of React Native imports
// so it runs under node-jest and can be reused by the migration flow.

const DC = DC_MINT.toBase58()
const SOL = NATIVE_MINT.toBase58()
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

// Mints every account shows, whether or not the wallet holds them.
export const DEFAULT_TOKENS = new Set([
  HNT_MINT.toBase58(),
  MOBILE_MINT.toBase58(),
  IOT_MINT.toBase58(),
  DC,
  SOL,
  USDC,
])

// Listed even at zero: DC and SOL fund everything else, USDC is the on-ramp.
const BALANCE_EXEMPT_MINTS = new Set([DC, SOL, USDC])

// Network tokens lead the list, highest first; everything else keeps the order
// it arrived in.
const sortValues: Record<string, number> = {
  [HNT_MINT.toBase58()]: 10,
  [IOT_MINT.toBase58()]: 9,
  [MOBILE_MINT.toBase58()]: 8,
  [DC]: 7,
}

export const getSortValue = (mint: string): number => sortValues[mint] || 0

// A wallet ATA, from useBalance().tokenAccounts. balance is the raw amount.
export type VisibleTokenAccount = {
  mint: string
  balance: number
  decimals: number
}

// Decimals-less accounts are NFTs, which the token list never shows. DC is the
// one fungible exception. Migration shares this so both flows agree on what
// counts as a token.
export const isNftLike = (ta: Pick<VisibleTokenAccount, 'mint' | 'decimals'>) =>
  ta.decimals === 0 && ta.mint !== DC

export const deriveVisibleMints = (args: {
  tokenAccounts: VisibleTokenAccount[] | undefined
  visibleTokens: ReadonlySet<string>
}): string[] => {
  const { tokenAccounts, visibleTokens } = args

  const taMints = tokenAccounts
    ?.filter(
      (ta) => visibleTokens.has(ta.mint) && ta.balance > 0 && !isNftLike(ta),
    )
    .map((ta) => ta.mint)

  return [...new Set([...DEFAULT_TOKENS, ...(taMints || [])])]
    .filter((mint) => {
      // A default token with no account at all stays listed so the user can
      // fund it later; once an account exists it has to hold something.
      const tokenAccount = tokenAccounts?.find((ta) => ta.mint === mint)
      if (!tokenAccount) return true

      return tokenAccount.balance > 0 || BALANCE_EXEMPT_MINTS.has(mint)
    })
    .sort((a, b) => getSortValue(b) - getSortValue(a))
}
