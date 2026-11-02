import { HNT_MINT } from '@helium/spl-utils'
import { Keypair } from '@solana/web3.js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BalanceProvider, useBalance } from '@utils/Balance'
import { TOKEN_ACCOUNTS_QUERY_KEY } from '@utils/balances'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { useMigrationAssets } from '../useMigrationAssets'

const mockWallet = Keypair.generate().publicKey
// One stable ref, as the real provider keeps
const mockAnchorProvider = { publicKey: mockWallet, connection: {} }
jest.mock('../../../../solana/SolanaProvider', () => ({
  useSolana: () => ({
    cluster: 'mainnet-beta',
    anchorProvider: mockAnchorProvider,
  }),
}))
const mockWalletAccount = { solanaAddress: mockWallet.toBase58() }
// The current account; a test may switch it to another wallet
let mockAccount = mockWalletAccount
jest.mock('../../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ currentAccount: mockAccount }),
}))
jest.mock('../../../../storage/AppStorageProvider', () => ({
  useAppStorage: () => ({ currency: 'USD', locked: false }),
}))
const mockTokenPrices = {}
jest.mock('../../../../utils/usePollTokenPrices', () => ({
  usePollTokenPrices: () => ({ tokenPrices: mockTokenPrices }),
}))
jest.mock('../../../../utils/useBalanceHistory', () => ({
  useBalanceHistory: () => ({ balanceHistory: [] }),
}))
jest.mock('../../../../utils/i18n', () => ({
  useLanguage: () => ({ language: 'en' }),
}))
jest.mock('../../../../utils/StoreAtaBalance', () => () => null)
jest.mock('../../../../utils/solanaUtils', () => ({ humanReadable: () => '0' }))
jest.mock('../../../../utils/walletApiV2', () => ({}))
// By default the sync never lands, so the wallet has no synced token data
const mockSync = jest.fn()
jest.mock('../../../../utils/balances', () => ({
  ...jest.requireActual('../../../../utils/balances'),
  syncTokenAccounts: (...args: unknown[]) => mockSync(...args),
}))
jest.mock('@helium/currency-utils', () => ({ getOraclePrice: jest.fn() }))
jest.mock(
  '@utils/Balance',
  () => jest.requireActual('../../../../utils/Balance'),
  { virtual: true },
)
jest.mock(
  '@utils/balances',
  () => jest.requireActual('../../../../utils/balances'),
  { virtual: true },
)
jest.mock(
  '@storage/TokensProvider',
  () => ({ useVisibleTokens: () => ({ visibleTokens: new Set() }) }),
  { virtual: true },
)
jest.mock(
  '@storage/BlockchainApiProvider',
  () => ({
    useBlockchainApi: () => ({
      migration: { getHotspots: () => Promise.resolve({ hotspots: [] }) },
    }),
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/usePublicKey',
  () => jest.requireActual('../../../../hooks/usePublicKey'),
  { virtual: true },
)
jest.mock('@helium/helium-react-hooks', () => ({
  useSolOwnedAmount: () => ({ amount: BigInt(0), loading: false }),
}))
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

beforeEach(() => {
  jest.useFakeTimers()
  mockAccount = mockWalletAccount
  mockSync.mockReset()
  mockSync.mockReturnValue(new Promise(() => {}))
})

afterEach(() => {
  jest.useRealTimers()
})

// TanStack notifies on a 0 ms timer, so let it run inside act
const settle = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(10)
  })

const onRender = jest.fn<void, [{ tokenAccounts: unknown; loading: boolean }]>()
const Probe = () => {
  const { tokenAccounts } = useBalance()
  const { loading } = useMigrationAssets(mockWallet.toBase58())
  onRender({ tokenAccounts, loading })
  return null
}

it('keeps migration assets loading while the token list has not synced', async () => {
  const queryClient = new QueryClient()
  await act(async () => {
    TestRenderer.create(
      <QueryClientProvider client={queryClient}>
        <BalanceProvider>
          <Probe />
        </BalanceProvider>
      </QueryClientProvider>,
    )
  })
  await settle()

  expect(onRender.mock.lastCall?.[0]).toEqual({
    tokenAccounts: undefined,
    loading: true,
  })

  // The state a sync of an empty wallet stores
  await act(async () => {
    queryClient.setQueryData(
      [...TOKEN_ACCOUNTS_QUERY_KEY, 'mainnet-beta', mockWallet.toBase58()],
      { atas: [], sol: { tokenAccount: mockWallet.toBase58(), balance: 0 } },
    )
  })
  await settle()

  expect(onRender.mock.lastCall?.[0]).toEqual({
    tokenAccounts: [],
    loading: false,
  })
  queryClient.clear()
})

it('reports an error when the first token sync fails and loads the tokens on reload', async () => {
  mockSync.mockRejectedValueOnce(new Error('rpc down'))
  const queryClient = new QueryClient()
  let assets: ReturnType<typeof useMigrationAssets> | undefined
  const AssetsProbe = () => {
    const result = useMigrationAssets(mockWallet.toBase58())
    React.useEffect(() => {
      assets = result
    })
    return null
  }
  await act(async () => {
    TestRenderer.create(
      <QueryClientProvider client={queryClient}>
        <BalanceProvider>
          <AssetsProbe />
        </BalanceProvider>
      </QueryClientProvider>,
    )
  })
  await settle()

  expect(assets?.loading).toBe(false)
  expect(assets?.error).toBeInstanceOf(Error)
  expect(mockSync).toHaveBeenCalledTimes(1)

  // The retried sync stores one HNT account
  mockSync.mockImplementationOnce(async (client: QueryClient) => {
    const tokens = {
      atas: [
        {
          tokenAccount: Keypair.generate().publicKey.toBase58(),
          mint: HNT_MINT.toBase58(),
          balance: 100_000_000,
          decimals: 8,
          frozen: false,
        },
      ],
      sol: { tokenAccount: mockWallet.toBase58(), balance: 0 },
    }
    client.setQueryData(
      [...TOKEN_ACCOUNTS_QUERY_KEY, 'mainnet-beta', mockWallet.toBase58()],
      tokens,
    )
    return tokens
  })
  await act(async () => {
    await assets?.reload()
  })
  await settle()

  expect(mockSync).toHaveBeenCalledTimes(2)
  expect(assets?.error).toBeNull()
  expect(assets?.loading).toBe(false)
  expect(assets?.tokens.map(({ mint }) => mint)).toEqual([HNT_MINT.toBase58()])
  queryClient.clear()
})

const tokenAccountsKey = [
  ...TOKEN_ACCOUNTS_QUERY_KEY,
  'mainnet-beta',
  mockWallet.toBase58(),
]

// A sync that stores one HNT account
const storeHntAccount = async (client: QueryClient) => {
  const tokens = {
    atas: [
      {
        tokenAccount: Keypair.generate().publicKey.toBase58(),
        mint: HNT_MINT.toBase58(),
        balance: 100_000_000,
        decimals: 8,
        frozen: false,
      },
    ],
    sol: { tokenAccount: mockWallet.toBase58(), balance: 0 },
  }
  client.setQueryData(tokenAccountsKey, tokens)
  return tokens
}

const renderBalanceAndAssets = async (queryClient: QueryClient) => {
  const latest: {
    balance?: ReturnType<typeof useBalance>
    assets?: ReturnType<typeof useMigrationAssets>
  } = {}
  const LatestProbe = () => {
    const balance = useBalance()
    const assets = useMigrationAssets(mockWallet.toBase58())
    React.useEffect(() => {
      latest.balance = balance
      latest.assets = assets
    })
    return null
  }
  await act(async () => {
    TestRenderer.create(
      <QueryClientProvider client={queryClient}>
        <BalanceProvider>
          <LatestProbe />
        </BalanceProvider>
      </QueryClientProvider>,
    )
  })
  await settle()
  return latest
}

it('clears the token sync failure when a later sync succeeds', async () => {
  mockSync.mockRejectedValueOnce(new Error('rpc down'))
  const queryClient = new QueryClient()
  const latest = await renderBalanceAndAssets(queryClient)

  expect(latest.balance?.tokenSyncFailed).toBe(true)

  mockSync.mockImplementationOnce(storeHntAccount)
  await act(async () => {
    await latest.balance?.retryTokenSync()
  })
  await settle()

  expect(latest.balance?.tokenSyncFailed).toBe(false)
  queryClient.clear()
})

it('does not report a failed sync of one wallet for another wallet whose sync is in flight', async () => {
  mockSync.mockRejectedValueOnce(new Error('rpc down'))
  const queryClient = new QueryClient()
  let latest: ReturnType<typeof useBalance> | undefined
  const BalanceProbe = () => {
    const balance = useBalance()
    React.useEffect(() => {
      latest = balance
    })
    return null
  }
  const tree = () => (
    <QueryClientProvider client={queryClient}>
      <BalanceProvider>
        <BalanceProbe />
      </BalanceProvider>
    </QueryClientProvider>
  )
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(tree())
  })
  await settle()

  expect(latest?.tokenSyncFailed).toBe(true)

  // B has no stored data, and its sync never answers
  mockAccount = { solanaAddress: Keypair.generate().publicKey.toBase58() }
  await act(async () => {
    renderer?.update(tree())
  })
  await settle()

  expect(mockSync).toHaveBeenCalledTimes(2)
  expect(mockSync.mock.lastCall?.[1].acct).toBe(mockAccount)
  expect(latest?.tokenSyncFailed).toBe(false)
  queryClient.clear()
})

it('keeps the failed sync of a wallet when an earlier sync of another wallet lands after it', async () => {
  let resolveSyncA: (value: unknown) => void = () => {}
  mockSync.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveSyncA = resolve
    }),
  )
  const queryClient = new QueryClient()
  const latest: {
    balance?: ReturnType<typeof useBalance>
    assets?: ReturnType<typeof useMigrationAssets>
  } = {}
  const LatestProbe = () => {
    const balance = useBalance()
    const assets = useMigrationAssets(mockAccount.solanaAddress)
    React.useEffect(() => {
      latest.balance = balance
      latest.assets = assets
    })
    return null
  }
  const tree = () => (
    <QueryClientProvider client={queryClient}>
      <BalanceProvider>
        <LatestProbe />
      </BalanceProvider>
    </QueryClientProvider>
  )
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(tree())
  })
  await settle()

  // B has no stored data, and its sync fails while A's is in flight
  mockSync.mockRejectedValueOnce(new Error('rpc down'))
  mockAccount = { solanaAddress: Keypair.generate().publicKey.toBase58() }
  await act(async () => {
    renderer?.update(tree())
  })
  await settle()

  expect(mockSync).toHaveBeenCalledTimes(2)
  expect(latest.balance?.tokenSyncFailed).toBe(true)

  await act(async () => {
    resolveSyncA({ atas: [] })
  })
  await settle()

  expect(latest.balance?.tokenSyncFailed).toBe(true)
  expect(latest.assets?.loading).toBe(false)
  expect(latest.assets?.error).toBeInstanceOf(Error)
  queryClient.clear()
})

it('keeps migration assets loading without an error while a sync after a failed one is in flight', async () => {
  mockSync.mockRejectedValueOnce(new Error('rpc down'))
  const queryClient = new QueryClient()
  const latest = await renderBalanceAndAssets(queryClient)

  expect(latest.assets?.error).toBeInstanceOf(Error)

  // The retried sync's RPC never answers
  mockSync.mockImplementationOnce((client: QueryClient) =>
    client.fetchQuery({
      queryKey: tokenAccountsKey,
      queryFn: () => new Promise(() => {}),
    }),
  )
  await act(async () => {
    void latest.balance?.retryTokenSync()
  })
  await settle()

  expect(latest.balance?.tokenSyncFailed).toBe(true)
  expect(latest.balance?.tokenAccounts).toBeUndefined()
  expect(latest.assets?.loading).toBe(true)
  expect(latest.assets?.error).toBeNull()
  queryClient.clear()
})

it('lists the stored tokens without an error when a sync after a good one fails', async () => {
  mockSync.mockImplementationOnce(storeHntAccount)
  const queryClient = new QueryClient()
  const latest = await renderBalanceAndAssets(queryClient)

  expect(latest.assets?.tokens.map(({ mint }) => mint)).toEqual([
    HNT_MINT.toBase58(),
  ])

  mockSync.mockRejectedValueOnce(new Error('rpc down'))
  await act(async () => {
    await latest.balance?.retryTokenSync()
  })
  await settle()

  expect(latest.balance?.tokenSyncFailed).toBe(true)
  expect(latest.assets?.error).toBeNull()
  expect(latest.assets?.loading).toBe(false)
  expect(latest.assets?.tokens.map(({ mint }) => mint)).toEqual([
    HNT_MINT.toBase58(),
  ])
  queryClient.clear()
})
