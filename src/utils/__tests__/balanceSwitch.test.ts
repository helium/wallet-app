import React from 'react'
import TestRenderer from 'react-test-renderer'
import { BalanceProvider, useBalance } from '../Balance'

let mockAddress = 'A'
let mockCluster = 'mainnet-beta'
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ cluster: mockCluster, anchorProvider: undefined }),
}))
const mockAccounts: Record<string, { solanaAddress: string }> = {
  A: { solanaAddress: 'A' },
  B: { solanaAddress: 'B' },
  C: { solanaAddress: 'C' },
}
jest.mock('../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ currentAccount: mockAccounts[mockAddress] }),
}))
jest.mock('../../storage/AppStorageProvider', () => ({
  useAppStorage: () => ({ currency: 'USD', locked: false }),
}))
// 1 USD per lamport, so each account's SOL balance is its total in USD.
// One stable ref, as the real hook keeps.
const mockTokenPrices = { solana: { usd: 1e9 } }
jest.mock('../usePollTokenPrices', () => ({
  usePollTokenPrices: () => ({ tokenPrices: mockTokenPrices }),
}))
jest.mock('../useBalanceHistory', () => ({
  useBalanceHistory: () => ({ balanceHistory: [] }),
}))
jest.mock('../i18n', () => ({ useLanguage: () => ({ language: 'en' }) }))
jest.mock('../StoreAtaBalance', () => () => null)
jest.mock('../balances', () => ({
  tokenAccountsQueryOptions: ({
    cluster,
    solanaAddress,
  }: {
    cluster: string
    solanaAddress: string
  }) => ({
    queryKey: ['balances', 'tokens', cluster, solanaAddress],
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
// A and B on mainnet already have cached token data (persisted query
// cache). C and devnet start empty. Stable refs per key, as TanStack
// structural sharing gives.
let mockCache: Record<string, Record<string, unknown>> = {}
const resetCache = () => {
  mockCache = {
    'mainnet-beta': {
      A: { atas: [], sol: { balance: 1 } },
      B: { atas: [], sol: { balance: 2 } },
    },
    devnet: {},
  }
}
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: mockCache[queryKey[2]]?.[queryKey[3]],
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
  mockCluster = 'mainnet-beta'
  resetCache()
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

it('drops the previous total after switching to an account with no cached tokens', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  TestRenderer.act(() => {
    renderer = TestRenderer.create(tree())
  })
  const totalA = lastFormattedTotal()
  expect(totalA).toBeDefined()

  mockAddress = 'C'
  TestRenderer.act(() => {
    renderer?.update(tree())
  })
  expect(lastFormattedTotal()).toBeUndefined()

  mockCache['mainnet-beta'].C = { atas: [], sol: { balance: 3 } }
  TestRenderer.act(() => {
    renderer?.update(tree())
  })
  const totalC = lastFormattedTotal()
  expect(totalC).toBeDefined()
  expect(totalC).not.toEqual(totalA)
})

it('shows the new cluster total after a cluster switch on the same account', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  TestRenderer.act(() => {
    renderer = TestRenderer.create(tree())
  })
  const mainnetTotal = lastFormattedTotal()
  expect(mainnetTotal).toBeDefined()

  // BalanceProvider drops its context for the render where the cluster
  // changes, so render once more to read the hook's value.
  mockCluster = 'devnet'
  TestRenderer.act(() => {
    renderer?.update(tree())
  })
  TestRenderer.act(() => {
    renderer?.update(tree())
  })
  expect(lastFormattedTotal()).toBeUndefined()

  mockCache.devnet.A = { atas: [], sol: { balance: 5 } }
  TestRenderer.act(() => {
    renderer?.update(tree())
  })
  const devnetTotal = lastFormattedTotal()
  expect(devnetTotal).toBeDefined()
  expect(devnetTotal).not.toEqual(mainnetTotal)
})
