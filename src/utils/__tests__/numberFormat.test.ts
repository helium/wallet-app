import { numberFormat } from '../Balance'

// Balance.tsx also holds the balance provider. These stubs let the module
// load without the Solana, storage and query providers.
jest.mock('../../solana/SolanaProvider', () => ({ useSolana: () => ({}) }))
jest.mock('../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({}),
}))
jest.mock('../../storage/AppStorageProvider', () => ({
  useAppStorage: () => ({}),
}))
jest.mock('../usePollTokenPrices', () => ({ usePollTokenPrices: () => ({}) }))
jest.mock('../useBalanceHistory', () => ({ useBalanceHistory: () => ({}) }))
jest.mock('../i18n', () => ({ useLanguage: () => ({ language: 'en' }) }))
jest.mock('../StoreAtaBalance', () => () => null)
jest.mock('../balances', () => ({}))
jest.mock(
  '@storage/TokensProvider',
  () => ({ useVisibleTokens: () => ({ visibleTokens: new Set() }) }),
  { virtual: true },
)
jest.mock('../solanaUtils', () => ({ humanReadable: () => '0' }))
jest.mock('@helium/currency-utils', () => ({ getOraclePrice: jest.fn() }))

describe('numberFormat', () => {
  afterEach(() => jest.restoreAllMocks())

  it('formats an amount as currency for the language', () => {
    expect(numberFormat('en-US', 'USD', 1234.5)).toBe('$1,234.50')
    expect(numberFormat('en-GB', 'GBP', 1234.5)).toBe('£1,234.50')
    expect(numberFormat('en-US', 'usd', 0)).toBe('$0.00')
  })

  it('builds one formatter per language and currency', () => {
    const construct = jest.spyOn(Intl, 'NumberFormat')

    numberFormat('en-CA', 'CAD', 1)
    numberFormat('en-CA', 'CAD', 2)
    expect(construct).toHaveBeenCalledTimes(1)

    numberFormat('en-CA', 'EUR', 1)
    numberFormat('fr-CA', 'CAD', 1)
    expect(construct).toHaveBeenCalledTimes(3)
  })
})
