import { HNT_MINT } from '@helium/spl-utils'
import { estimateFiat } from '../fiat'
import { WSOL_MINT } from '../mints'

const HNT = HNT_MINT.toBase58()
const ARBITRARY_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const OTHER_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

const token = (mint: string) => ({
  mint,
  label: mint,
  decimals: 9,
  maxUi: '1',
})

const prices = {
  solana: { usd: 150 },
  helium: { usd: 5 },
}

describe('estimateFiat', () => {
  it('totals the selected amounts when every mint is priced', () => {
    expect(
      estimateFiat({
        tokens: [token(WSOL_MINT), token(HNT)],
        amounts: { [WSOL_MINT]: '1', [HNT]: '2' },
        prices,
        currency: 'usd',
      }),
    ).toEqual({ total: 160, unpricedCount: 0 })
  })

  it('totals only the priced mints and counts the rest', () => {
    expect(
      estimateFiat({
        tokens: [token(HNT), token(ARBITRARY_MINT)],
        amounts: { [HNT]: '3', [ARBITRARY_MINT]: '1000' },
        prices,
        currency: 'usd',
      }),
    ).toEqual({ total: 15, unpricedCount: 1 })
  })

  it('returns a zero total when nothing selected is priced', () => {
    expect(
      estimateFiat({
        tokens: [token(ARBITRARY_MINT), token(OTHER_MINT)],
        amounts: { [ARBITRARY_MINT]: '1', [OTHER_MINT]: '2' },
        prices,
        currency: 'usd',
      }),
    ).toEqual({ total: 0, unpricedCount: 2 })
  })

  it('counts a priced mint with no entry for the current currency as unpriced', () => {
    expect(
      estimateFiat({
        tokens: [token(WSOL_MINT), token(HNT)],
        amounts: { [WSOL_MINT]: '1', [HNT]: '2' },
        prices: { solana: { usd: 150 }, helium: {} },
        currency: 'usd',
      }),
    ).toEqual({ total: 150, unpricedCount: 1 })
  })

  it('ignores tokens with no amount selected', () => {
    expect(
      estimateFiat({
        tokens: [token(HNT), token(ARBITRARY_MINT)],
        amounts: { [HNT]: '2', [ARBITRARY_MINT]: '0' },
        prices,
        currency: 'usd',
      }),
    ).toEqual({ total: 10, unpricedCount: 0 })
  })

  it('counts every selected mint as unpriced when prices have not loaded', () => {
    expect(
      estimateFiat({
        tokens: [token(WSOL_MINT), token(HNT)],
        amounts: { [WSOL_MINT]: '1', [HNT]: '2' },
        prices: undefined,
        currency: 'usd',
      }),
    ).toEqual({ total: 0, unpricedCount: 2 })
  })
})
