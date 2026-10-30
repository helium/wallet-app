import React from 'react'
import TestRenderer from 'react-test-renderer'
import { BalanceProvider, useBalance } from '../Balance'

let mockAddress = 'A'
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ cluster: 'mainnet-beta', anchorProvider: undefined }),
}))
const mockAccounts: Record<string, { solanaAddress: string }> = {
  A: { solanaAddress: 'A' },
  B: { solanaAddress: 'B' },
}
jest.mock('../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ currentAccount: mockAccounts[mockAddress] }),
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
  tokenAccountsQueryOptions: ({
    solanaAddress,
  }: {
    solanaAddress: string
  }) => ({
    queryKey: ['balances', 'tokens', 'mainnet-beta', solanaAddress],
  }),
  syncTokenAccounts: jest.fn(),
}))
jest.mock(
  '@storage/TokensProvider',
  () => ({ useVisibleTokens: () => ({ visibleTokens: new Set() }) }),
  { virtual: true },
)
jest.mock('../solanaUtils', () => ({ humanReadable: () => '0' }))
jest.mock('@helium/currency-utils', () => ({ getOraclePrice: jest.fn() }))
// Both wallets already have cached token data (persisted query cache).
// Stable refs per key, as TanStack structural sharing gives.
const mockCache: Record<string, unknown> = {
  A: { atas: [], sol: { balance: 1 } },
  B: { atas: [], sol: { balance: 2 } },
}
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: mockCache[queryKey[3]],
  }),
  useQueryClient: () => ({}),
}))

const onRender = jest.fn<void, [string | undefined]>()
const lastFormattedTotal = () => onRender.mock.lastCall?.[0]
const Probe = () => {
  onRender(useBalance().formattedTotal)
  return null
}
const tree = () =>
  React.createElement(BalanceProvider, null, React.createElement(Probe))

beforeEach(() => {
  mockAddress = 'A'
  onRender.mockClear()
})

it('shows formattedTotal on mount when the account has cached tokens', () => {
  TestRenderer.act(() => {
    TestRenderer.create(tree())
  })
  expect(lastFormattedTotal()).toBeDefined()
})

it('shows formattedTotal after switching to an account with cached tokens', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  TestRenderer.act(() => {
    renderer = TestRenderer.create(tree())
  })
  mockAddress = 'B'
  TestRenderer.act(() => {
    renderer?.update(tree())
  })
  expect(lastFormattedTotal()).toBeDefined()
})
