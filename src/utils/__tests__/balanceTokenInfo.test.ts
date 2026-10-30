import React from 'react'
import TestRenderer from 'react-test-renderer'
import { BalanceProvider } from '../Balance'

jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ cluster: 'mainnet-beta', anchorProvider: undefined }),
}))
jest.mock('../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ currentAccount: undefined }),
}))
jest.mock('../../storage/AppStorageProvider', () => ({
  useAppStorage: () => ({ currency: 'USD', locked: false }),
}))
jest.mock('../usePollTokenPrices', () => ({
  usePollTokenPrices: () => ({ tokenPrices: undefined }),
}))
jest.mock('../useBalanceHistory', () => ({
  useBalanceHistory: () => ({ balanceHistory: [] }),
}))
jest.mock('../i18n', () => ({ useLanguage: () => ({ language: 'en' }) }))
jest.mock('../StoreAtaBalance', () => () => null)
jest.mock('../balances', () => ({
  tokenAccountsQueryOptions: () => ({ queryKey: ['tokenAccounts'] }),
  syncTokenAccounts: jest.fn(),
}))
jest.mock(
  '@storage/TokensProvider',
  () => ({
    useVisibleTokens: () => ({ visibleTokens: new Set() }),
  }),
  { virtual: true },
)
jest.mock('../solanaUtils', () => ({ humanReadable: () => '' }))
jest.mock('@helium/currency-utils', () => ({ getOraclePrice: jest.fn() }))
jest.mock('@tanstack/react-query', () => ({
  // The token query is disabled and nothing has synced yet
  useQuery: () => ({ data: undefined }),
  useQueryClient: () => ({}),
}))

it('renders BalanceProvider before any token data exists', () => {
  expect(() =>
    TestRenderer.act(() => {
      TestRenderer.create(React.createElement(BalanceProvider, null, null))
    }),
  ).not.toThrow()
})
