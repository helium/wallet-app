import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { swapRoute } from '../swapRoute'

describe('swapRoute', () => {
  it('mints DC for HNT to DC on mainnet, never Jupiter', () => {
    expect(
      swapRoute({ inputMint: HNT_MINT, outputMint: DC_MINT, isDevnet: false }),
    ).toBe('mintDc')
  })

  it('mints DC for HNT to DC on devnet, never the treasury', () => {
    expect(
      swapRoute({ inputMint: HNT_MINT, outputMint: DC_MINT, isDevnet: true }),
    ).toBe('mintDc')
  })

  it('uses the treasury for other pairs on devnet', () => {
    expect(
      swapRoute({
        inputMint: MOBILE_MINT,
        outputMint: HNT_MINT,
        isDevnet: true,
      }),
    ).toBe('treasury')
  })

  it('uses Jupiter for other pairs on mainnet', () => {
    expect(
      swapRoute({ inputMint: IOT_MINT, outputMint: HNT_MINT, isDevnet: false }),
    ).toBe('jupiter')
    expect(
      swapRoute({ inputMint: DC_MINT, outputMint: HNT_MINT, isDevnet: false }),
    ).toBe('jupiter')
  })
})
