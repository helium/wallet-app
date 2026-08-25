import { classifyHoldings, nothingToMigrate } from '../assets'
import { WSOL_MINT } from '../mints'

const HNT = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
const UNKNOWN = 'FAKEmint1111111111111111111111111111111111'

describe('classifyHoldings', () => {
  it('offers a visible, non-frozen holding with a balance', () => {
    const r = classifyHoldings({
      holdings: [{ mint: UNKNOWN, balance: 5000000, decimals: 6 }],
      visibleTokens: new Set([UNKNOWN]),
      solBalance: 0,
    })
    expect(r.migratableTokens).toMatchObject([
      { mint: UNKNOWN, decimals: 6, maxUi: '5' },
    ])
    expect(r.leftBehindMints).toEqual([])
  })

  it('prepends native SOL as WSOL when solBalance > 0', () => {
    const r = classifyHoldings({
      holdings: [],
      visibleTokens: new Set<string>(),
      solBalance: 1.5,
    })
    expect(r.migratableTokens[0].mint).toBe(WSOL_MINT)
    expect(r.migratableTokens[0].maxUi).toBe('1.5')
  })

  it('omits native SOL when solBalance is 0', () => {
    const r = classifyHoldings({
      holdings: [],
      visibleTokens: new Set<string>(),
      solBalance: 0,
    })
    expect(r.migratableTokens).toHaveLength(0)
  })

  it('labels a holding with its shortened mint', () => {
    const r = classifyHoldings({
      holdings: [{ mint: HNT, balance: 142500000000, decimals: 9 }],
      visibleTokens: new Set([HNT]),
      solBalance: 0,
    })
    expect(r.migratableTokens).toMatchObject([
      { mint: HNT, label: 'hnty…xWux', maxUi: '142.5' },
    ])
  })

  it('leaves behind a hidden holding with a balance', () => {
    const r = classifyHoldings({
      holdings: [
        { mint: UNKNOWN, balance: 5000, decimals: 6 },
        { mint: HNT, balance: 10, decimals: 9 }, // visible → offered
      ],
      visibleTokens: new Set([HNT]),
      solBalance: 0,
    })
    expect(r.migratableTokens.map((tk) => tk.mint)).toEqual([HNT])
    expect(r.leftBehindMints).toEqual([UNKNOWN])
  })

  it('leaves behind a wrapped-SOL ATA with a balance', () => {
    const r = classifyHoldings({
      holdings: [{ mint: WSOL_MINT, balance: 5000, decimals: 9 }],
      visibleTokens: new Set([WSOL_MINT]),
      solBalance: 0,
    })
    expect(r.migratableTokens).toEqual([])
    expect(r.leftBehindMints).toEqual([WSOL_MINT])
  })

  it('leaves behind a frozen holding even when it is visible', () => {
    const r = classifyHoldings({
      holdings: [{ mint: HNT, balance: 10, decimals: 9, frozen: true }],
      visibleTokens: new Set([HNT]),
      solBalance: 0,
    })
    expect(r.migratableTokens).toEqual([])
    expect(r.leftBehindMints).toEqual([HNT])
  })

  it('ignores NFT-shaped holdings (decimals 0) in both lists', () => {
    const NFT = 'NFTmint11111111111111111111111111111111111'
    const r = classifyHoldings({
      holdings: [
        { mint: NFT, balance: 1, decimals: 0 }, // NFT → not a token
        { mint: UNKNOWN, balance: 5000, decimals: 6 },
      ],
      visibleTokens: new Set([NFT]),
      solBalance: 0,
    })
    expect(r.migratableTokens).toEqual([])
    expect(r.leftBehindMints).toEqual([UNKNOWN])
  })

  it('treats any decimals-0 holding as an NFT, like the account token list', () => {
    const r = classifyHoldings({
      holdings: [{ mint: UNKNOWN, balance: 42, decimals: 0 }],
      visibleTokens: new Set<string>(),
      solBalance: 0,
    })
    expect(r.migratableTokens).toEqual([])
    expect(r.leftBehindMints).toEqual([])
  })

  it('keeps DC as a fungible token despite its zero decimals', () => {
    const DC = 'dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm'
    const r = classifyHoldings({
      holdings: [{ mint: DC, balance: 1, decimals: 0, frozen: true }],
      visibleTokens: new Set([DC]),
      solBalance: 0,
    })
    expect(r.leftBehindMints).toEqual([DC])
  })

  it('omits zero-balance holdings from both lists', () => {
    const r = classifyHoldings({
      holdings: [{ mint: UNKNOWN, balance: 0, decimals: 6 }],
      visibleTokens: new Set([UNKNOWN]),
      solBalance: 0,
    })
    expect(r.migratableTokens).toEqual([])
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
