import { Connection, Keypair } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import SolanaProvider from '../SolanaProvider'
import { getLastCheckedSlot, saveCacheThenSlot } from '../lastCheckedSlot'

jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  Connection: jest.fn(),
}))
// 150 cached accounts: two getMultipleAccounts chunks of up to 100
const mockKeys = Array.from({ length: 150 }, () =>
  Keypair.generate().publicKey.toBase58(),
)
jest.mock('../AsyncAccountCache', () => ({
  AsyncAccountCache: class {
    cacheKey: string

    constructor(cacheKey: string) {
      this.cacheKey = cacheKey
    }

    init = () => Promise.resolve()

    keys = () => mockKeys
  },
}))
jest.mock('../lastCheckedSlot', () => ({
  getLastCheckedSlot: jest.fn(),
  saveCacheThenSlot: jest.fn(),
}))
jest.mock('@helium/account-fetch-cache', () => ({
  AccountFetchCache: class {
    statics = new Set()

    get = () => undefined

    close = () => {}

    updateCacheAndRaiseUpdated = () => Promise.resolve()
  },
}))
jest.mock('@helium/account-fetch-cache-hooks', () => ({
  AccountContext: jest.requireActual('react').createContext(undefined),
}))
jest.mock('@solana/wallet-adapter-react', () => ({
  ConnectionContext: jest.requireActual('react').createContext(undefined),
}))
jest.mock('@helium/react-native-sdk', () => ({
  SolanaProvider: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('../../features/keystone/KeystoneModal', () =>
  jest
    .requireActual('react')
    .forwardRef(
      ({ children }: { children: React.ReactNode }, _ref: unknown) => children,
    ),
)
jest.mock('../../features/ledger/LedgerModal', () =>
  jest
    .requireActual('react')
    .forwardRef(
      ({ children }: { children: React.ReactNode }, _ref: unknown) => children,
    ),
)
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined }),
}))
jest.mock('../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({
    currentAccount: undefined,
    secureAccountsVersion: 0,
  }),
}))
jest.mock('../../storage/secureStorage', () => ({}))
jest.mock('../../store/appStore', () => ({
  useAppStore: (
    select: (state: { cluster: string; setCluster: () => void }) => unknown,
  ) => select({ cluster: 'mainnet-beta', setCluster: () => {} }),
}))
// Already wrapped, so the provider leaves its methods alone
const mockConnection = { rpcEndpoint: 'https://rpc.test', wrapped: true }
jest.mock('../../utils/solanaUtils', () => ({
  getConnection: () => mockConnection,
}))
jest.mock('../signing', () => ({}))
jest.mock('@utils/accountUtils', () => ({}), { virtual: true })
jest.mock('@utils/i18n', () => ({}), { virtual: true })
jest.mock('@utils/WrappedConnection', () => ({}), { virtual: true })
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const CURRENT_SLOT = 200
const rpcRequest = jest.fn()
const saveSlot = saveCacheThenSlot as jest.Mock
let consoleError: jest.SpyInstance

// The JSON-RPC body web3.js resolves with, for a chunk of keys
const accountsResult = (keys: string[]) => ({
  result: { context: { slot: CURRENT_SLOT }, value: keys.map(() => null) },
})
const rpcError = { error: { code: -32005, message: 'Node is behind' } }

beforeEach(() => {
  jest.useFakeTimers()
  ;(Connection as unknown as jest.Mock).mockImplementation(() => ({
    getSlot: () => Promise.resolve(CURRENT_SLOT),
    _rpcRequest: rpcRequest,
  }))
  ;(getLastCheckedSlot as jest.Mock).mockResolvedValue(100)
  saveSlot.mockReset()
  saveSlot.mockResolvedValue(undefined)
  rpcRequest.mockReset()
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleError.mockRestore()
  jest.useRealTimers()
})

// Mount the provider and let its startup account refresh run to its end
const mountAndRefresh = async () => {
  await act(async () => {
    TestRenderer.create(<SolanaProvider>{null}</SolanaProvider>)
  })
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10)
  })
}

it('keeps the last checked slot when a chunk returns a JSON-RPC error', async () => {
  rpcRequest
    .mockImplementationOnce((_method: string, [keys]: [string[]]) =>
      Promise.resolve(accountsResult(keys)),
    )
    .mockResolvedValueOnce(rpcError)

  await mountAndRefresh()

  expect(rpcRequest).toHaveBeenCalledTimes(2)
  expect(consoleError).toHaveBeenCalledWith('RPC error:', rpcError.error)
  expect(saveSlot).not.toHaveBeenCalled()
})

it('saves the current slot with the cache after every chunk succeeds', async () => {
  rpcRequest.mockImplementation((_method: string, [keys]: [string[]]) =>
    Promise.resolve(accountsResult(keys)),
  )

  await mountAndRefresh()

  expect(rpcRequest).toHaveBeenCalledTimes(2)
  expect(rpcRequest.mock.calls[0][1][1]).toMatchObject({
    changedSinceSlot: 100,
  })
  expect(saveSlot).toHaveBeenCalledTimes(1)
  expect(saveSlot.mock.calls[0][0].cacheKey).toBe('accounts-mainnet-beta')
  expect(saveSlot.mock.calls[0][1]).toBe(CURRENT_SLOT)
})

it('awaits the slot save and logs its failure', async () => {
  rpcRequest.mockImplementation((_method: string, [keys]: [string[]]) =>
    Promise.resolve(accountsResult(keys)),
  )
  const writeError = new Error('keychain locked')
  saveSlot.mockRejectedValue(writeError)

  await mountAndRefresh()

  expect(consoleError).toHaveBeenCalledWith(
    'Failed to fetch accounts',
    writeError,
  )
})
