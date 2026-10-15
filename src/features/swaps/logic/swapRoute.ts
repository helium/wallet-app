import { DC_MINT, HNT_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'

export type SwapRoute = 'mintDc' | 'treasury' | 'jupiter'

// HNT to DC always mints DC at the oracle price. Jupiter has no HNT to DC
// route, so falling through to it fails with "Swap routes missing".
export const swapRoute = ({
  inputMint,
  outputMint,
  isDevnet,
}: {
  inputMint: PublicKey
  outputMint: PublicKey
  isDevnet: boolean
}): SwapRoute => {
  if (inputMint.equals(HNT_MINT) && outputMint.equals(DC_MINT)) return 'mintDc'
  if (isDevnet) return 'treasury'
  return 'jupiter'
}
