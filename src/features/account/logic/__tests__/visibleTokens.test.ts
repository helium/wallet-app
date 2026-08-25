import { deriveVisibleMints } from '../visibleTokens'

const HNT = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
const MOBILE = 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6'
const IOT = 'iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns'
const DC = 'dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm'
const SOL = 'So11111111111111111111111111111111111111112'
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const BONK = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
const WIF = 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'
const NFT = 'NFTmint11111111111111111111111111111111111'

describe('deriveVisibleMints', () => {
  it('always includes the default tokens, even with no token accounts', () => {
    const mints = deriveVisibleMints({
      tokenAccounts: undefined,
      visibleTokens: new Set<string>(),
    })

    expect(new Set(mints)).toEqual(new Set([HNT, MOBILE, IOT, DC, SOL, USDC]))
  })

  it('includes a visible non-default token with a balance', () => {
    const mints = deriveVisibleMints({
      tokenAccounts: [{ mint: BONK, balance: 1000, decimals: 5 }],
      visibleTokens: new Set([BONK]),
    })

    expect(mints).toContain(BONK)
  })

  it('excludes a hidden token even when it has a balance', () => {
    const mints = deriveVisibleMints({
      tokenAccounts: [
        { mint: BONK, balance: 1000, decimals: 5 },
        { mint: WIF, balance: 2000, decimals: 6 },
      ],
      visibleTokens: new Set([BONK]),
    })

    expect(mints).not.toContain(WIF)
  })

  it('drops a default token whose account is empty', () => {
    const mints = deriveVisibleMints({
      tokenAccounts: [{ mint: HNT, balance: 0, decimals: 8 }],
      visibleTokens: new Set([HNT]),
    })

    expect(mints).not.toContain(HNT)
  })

  it('keeps DC, SOL and USDC when their accounts are empty', () => {
    const mints = deriveVisibleMints({
      tokenAccounts: [
        { mint: DC, balance: 0, decimals: 0 },
        { mint: SOL, balance: 0, decimals: 9 },
        { mint: USDC, balance: 0, decimals: 6 },
      ],
      visibleTokens: new Set([DC, SOL, USDC]),
    })

    expect(mints).toEqual(expect.arrayContaining([DC, SOL, USDC]))
  })

  it('excludes NFT-like accounts, which have no decimals', () => {
    const mints = deriveVisibleMints({
      tokenAccounts: [{ mint: NFT, balance: 1, decimals: 0 }],
      visibleTokens: new Set([NFT]),
    })

    expect(mints).not.toContain(NFT)
  })

  it('keeps DC despite its zero decimals', () => {
    const mints = deriveVisibleMints({
      tokenAccounts: [{ mint: DC, balance: 5000, decimals: 0 }],
      visibleTokens: new Set([DC]),
    })

    expect(mints).toContain(DC)
  })

  // Captured from the account token list before the derivation moved here, so a
  // change in either membership or order fails.
  it('reproduces the account token list for a whole account', () => {
    const mints = deriveVisibleMints({
      tokenAccounts: [
        { mint: USDC, balance: 0, decimals: 6 },
        { mint: BONK, balance: 1000, decimals: 5 },
        { mint: WIF, balance: 2000, decimals: 6 },
        { mint: NFT, balance: 1, decimals: 0 },
        { mint: HNT, balance: 500, decimals: 8 },
        { mint: SOL, balance: 12345, decimals: 9 },
        { mint: DC, balance: 0, decimals: 0 },
        { mint: MOBILE, balance: 750, decimals: 6 },
      ],
      visibleTokens: new Set([HNT, MOBILE, IOT, DC, SOL, USDC, BONK, NFT]),
    })

    expect(mints).toEqual([HNT, IOT, MOBILE, DC, SOL, USDC, BONK])
  })
})
