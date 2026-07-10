import { classifyHoldings, nothingToMigrate } from '../assets'
import { WSOL_MINT } from '../mints'

const HNT = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
const UNKNOWN = 'FAKEmint1111111111111111111111111111111111'

describe('classifyHoldings', () => {
  it('prepends native SOL as WSOL when solBalance > 0', () => {
    const r = classifyHoldings({
      migratable: [],
      solBalance: 1.5,
      holdings: [],
    })
    expect(r.migratableTokens[0].mint).toBe(WSOL_MINT)
    expect(r.migratableTokens[0].maxUi).toBe('1.5')
  })

  it('omits native SOL when solBalance is 0', () => {
    const r = classifyHoldings({ migratable: [], solBalance: 0, holdings: [] })
    expect(r.migratableTokens).toHaveLength(0)
  })

  it('includes migratable tokens with a readable label', () => {
    const r = classifyHoldings({
      migratable: [
        {
          mint: HNT,
          balance: '142500000000',
          decimals: 9,
          uiAmount: 142.5,
          symbol: 'HNT',
        },
      ],
      solBalance: 0,
      holdings: [],
    })
    const hnt = r.migratableTokens.find((t) => t.mint === HNT)
    expect(hnt).toMatchObject({
      label: 'HNT',
      maxUi: '142.5',
    })
  })

  it('flags nonzero holdings of unsupported mints as left behind', () => {
    const r = classifyHoldings({
      migratable: [],
      solBalance: 0,
      holdings: [
        { mint: UNKNOWN, balance: 5000, decimals: 6 },
        { mint: HNT, balance: 10, decimals: 9 }, // supported → not flagged
      ],
    })
    expect(r.leftBehindMints).toEqual([UNKNOWN])
  })

  it('excludes NFT-shaped holdings (decimals 0, balance 1) from left behind', () => {
    const NFT = 'NFTmint11111111111111111111111111111111111'
    const r = classifyHoldings({
      migratable: [],
      solBalance: 0,
      holdings: [
        { mint: NFT, balance: 1, decimals: 0 }, // NFT → not a token
        { mint: UNKNOWN, balance: 5000, decimals: 6 },
      ],
    })
    expect(r.leftBehindMints).toEqual([UNKNOWN])
  })

  it('keeps decimals-0 fungible balances above 1 as left behind', () => {
    const r = classifyHoldings({
      migratable: [],
      solBalance: 0,
      holdings: [{ mint: UNKNOWN, balance: 42, decimals: 0 }],
    })
    expect(r.leftBehindMints).toEqual([UNKNOWN])
  })

  it('ignores zero-balance unsupported holdings', () => {
    const r = classifyHoldings({
      migratable: [],
      solBalance: 0,
      holdings: [{ mint: UNKNOWN, balance: 0, decimals: 6 }],
    })
    expect(r.leftBehindMints).toEqual([])
  })
})

describe('nothingToMigrate', () => {
  it('is true only when loaded and both lists are empty', () => {
    expect(nothingToMigrate(false, [], [])).toBe(true)
  })

  it('is false while loading', () => {
    expect(nothingToMigrate(true, [], [])).toBe(false)
  })

  it('is false with a hotspot', () => {
    expect(nothingToMigrate(false, [{}], [])).toBe(false)
  })

  it('is false with a token', () => {
    expect(nothingToMigrate(false, [], [{}])).toBe(false)
  })
})
