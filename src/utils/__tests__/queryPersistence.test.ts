import { QueryClient } from '@tanstack/react-query'
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client'
import { mmkv } from '../../storage/mmkv'
import { useCloudStore } from '../../store/cloudStore'
import { heliumAddressToSolAddress } from '../accountUtils'
import { createQueryClient } from '../queryClient'
import { QUERY_CACHE_KEY, queryPersistOptions } from '../queryPersistence'

// accountUtils imports this native module, which jest cannot parse
jest.mock('bcrypt-react-native', () => ({}))
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.requireActual(
    'react-native-mmkv/lib/createMMKV/createMockMMKV',
  ).createMockMMKV,
}))

const DAY = 24 * 60 * 60 * 1000
const heliumAddress = '13BnsQ6hHjfvJXYxwpWeMaD5Ep5nN1b4BPRJy4AqBkDq3mTF8Sk'
const solanaAddress = 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4'
const collectablesKey = ['collectables', 'mainnet-beta', solanaAddress]
const collectables = {
  collectables: { HOTSPOT: [{ id: 'nft-1' }] },
  collectablesWithMeta: { HOTSPOT: [{ id: 'nft-1', content: {} }] },
}

const clients: QueryClient[] = []
const newClient = () => {
  const client = createQueryClient()
  clients.push(client)
  return client
}

const save = async (queryClient: QueryClient) => {
  // Step past the persister's one-second write throttle
  jest.advanceTimersByTime(1_000)
  await persistQueryClientSave({ queryClient, ...queryPersistOptions })
}

const restore = async () => {
  const queryClient = newClient()
  await persistQueryClientRestore({ queryClient, ...queryPersistOptions })
  return queryClient
}

// One fake clock for the file, so it never runs behind the write throttle of
// the shared persister
beforeAll(() => {
  jest.useFakeTimers()
})

const resetCloudStore = () =>
  useCloudStore.setState(useCloudStore.getInitialState(), true)

beforeEach(() => {
  mmkv.clearAll()
  resetCloudStore()
  // Signed in: the cloud store holds an account
  useCloudStore.setState({
    accounts: {
      [heliumAddress]: {
        alias: 'Main',
        address: heliumAddress,
        solanaAddress,
        netType: 0,
      },
    },
  })
})

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
})

afterAll(() => {
  jest.useRealTimers()
})

describe('queryPersistOptions', () => {
  it('saves collectables to MMKV and leaves other queries out', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    client.setQueryData(['notifications'], ['note'])
    await save(client)

    const restored = await restore()

    expect(restored.getQueryData(collectablesKey)).toEqual(collectables)
    expect(restored.getQueryData(['notifications'])).toBeUndefined()
  })

  it('saves hotspots pages and the full hotspot list to MMKV', async () => {
    const pagesKey = ['hotspots', 'mainnet-beta', collectablesKey[2]]
    const allKey = [...pagesKey, 'all']
    const pages = { pages: [{ items: [{ id: 'hotspot-1' }] }], pageParams: [0] }
    const all = { hotspots: [{ id: 'hotspot-1' }], recipients: [] }
    const client = newClient()
    client.setQueryData(pagesKey, pages)
    client.setQueryData(allKey, all)
    await save(client)

    const restored = await restore()

    expect(restored.getQueryData(pagesKey)).toEqual(pages)
    expect(restored.getQueryData(allKey)).toEqual(all)
  })

  it('saves token accounts, prices and balance history to MMKV', async () => {
    const wallet = collectablesKey[2]
    const tokensKey = ['balances', 'tokens', 'mainnet-beta', wallet]
    const pricesKey = ['balances', 'prices', 'usd']
    const historyKey = ['balances', 'history', 'mainnet-beta', wallet, 'usd']
    const tokens = {
      atas: [
        {
          tokenAccount: 'ata-1',
          mint: 'mint-1',
          balance: 5,
          decimals: 8,
          frozen: false,
        },
      ],
      sol: { tokenAccount: wallet, balance: 1000 },
    }
    const prices = { helium: { usd: 2.5 } }
    const history = [{ date: '2026-10-01', balance: 25 }]
    const client = newClient()
    client.setQueryData(tokensKey, tokens)
    client.setQueryData(pricesKey, prices)
    client.setQueryData(historyKey, history)
    await save(client)

    const restored = await restore()

    expect(restored.getQueryData(tokensKey)).toEqual(tokens)
    expect(restored.getQueryData(pricesKey)).toEqual(prices)
    expect(restored.getQueryData(historyKey)).toEqual(history)
  })

  it('saves no token accounts or history of a wallet not stored', async () => {
    const wallet = 'other-solana-address'
    const tokensKey = ['balances', 'tokens', 'mainnet-beta', wallet]
    const historyKey = ['balances', 'history', 'mainnet-beta', wallet, 'usd']
    const client = newClient()
    client.setQueryData(tokensKey, { atas: [] })
    client.setQueryData(historyKey, [{ date: '2026-10-01', balance: 25 }])
    await save(client)

    const restored = await restore()

    expect(restored.getQueryData(tokensKey)).toBeUndefined()
    expect(restored.getQueryData(historyKey)).toBeUndefined()
  })

  it('saves no token prices while the cloud store holds no account', async () => {
    resetCloudStore()
    const pricesKey = ['balances', 'prices', 'usd']
    const client = newClient()
    client.setQueryData(pricesKey, { helium: { usd: 2.5 } })
    await save(client)

    const restored = await restore()

    expect(restored.getQueryData(pricesKey)).toBeUndefined()
  })

  it('restores a cache saved 7 days ago', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    await save(client)

    // save steps 1 s past the fetch, so the data is 7 days old at restore
    jest.advanceTimersByTime(7 * DAY - 1_000)
    const restored = await restore()

    expect(restored.getQueryData(collectablesKey)).toEqual(collectables)
  })

  it('drops a cache saved more than 7 days ago', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    await save(client)

    jest.advanceTimersByTime(7 * DAY + 1)
    const restored = await restore()

    expect(restored.getQueryData(collectablesKey)).toBeUndefined()
    expect(mmkv.contains(QUERY_CACHE_KEY)).toBe(false)
  })

  it('drops a cache saved under another cache schema version', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    await save(client)
    const stored = JSON.parse(mmkv.getString(QUERY_CACHE_KEY) as string)
    mmkv.set(
      QUERY_CACHE_KEY,
      JSON.stringify({ ...stored, buster: `${stored.buster}-old` }),
    )

    const restored = await restore()

    expect(restored.getQueryData(collectablesKey)).toBeUndefined()
    expect(mmkv.contains(QUERY_CACHE_KEY)).toBe(false)
  })

  it('drops a cache saved before the cache schema version existed', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    await save(client)
    const stored = JSON.parse(mmkv.getString(QUERY_CACHE_KEY) as string)
    // With no buster option the persister writes an empty buster
    mmkv.set(QUERY_CACHE_KEY, JSON.stringify({ ...stored, buster: '' }))

    const restored = await restore()

    expect(restored.getQueryData(collectablesKey)).toBeUndefined()
    expect(mmkv.contains(QUERY_CACHE_KEY)).toBe(false)
  })

  it('saves no query while the cloud store holds no account', async () => {
    resetCloudStore()
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    await save(client)

    expect(mmkv.contains(QUERY_CACHE_KEY)).toBe(false)
  })

  it('saves only the queries of accounts still stored', async () => {
    const otherHeliumAddress = 'other-helium-address'
    const otherSolanaAddress = 'other-solana-address'
    const otherKey = ['collectables', 'mainnet-beta', otherSolanaAddress]
    useCloudStore.setState({
      accounts: {
        ...useCloudStore.getState().accounts,
        [otherHeliumAddress]: {
          alias: 'Other',
          address: otherHeliumAddress,
          solanaAddress: otherSolanaAddress,
          netType: 0,
        },
      },
    })
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    client.setQueryData(otherKey, collectables)

    // Sign out the first account
    const remaining = { ...useCloudStore.getState().accounts }
    delete remaining[heliumAddress]
    useCloudStore.setState({ accounts: remaining })
    await save(client)

    const restored = await restore()

    expect(restored.getQueryData(collectablesKey)).toBeUndefined()
    expect(restored.getQueryData(otherKey)).toEqual(collectables)
  })

  it('saves the queries of an account stored with no Solana address', async () => {
    const validHeliumAddress =
      '13PuqyWXzPYeXcF1B9ZRx7RLkEygeL374ZABiQdwRSNzASdA1sn'
    const derivedAddress = heliumAddressToSolAddress(validHeliumAddress)
    expect(derivedAddress).not.toBe('')
    useCloudStore.setState({
      accounts: {
        [validHeliumAddress]: {
          alias: 'Legacy',
          address: validHeliumAddress,
          netType: 0,
        },
      },
    })
    const key = ['collectables', 'mainnet-beta', derivedAddress]
    const client = newClient()
    client.setQueryData(key, collectables)
    await save(client)

    const restored = await restore()

    expect(restored.getQueryData(key)).toEqual(collectables)
  })

  it('saves no paused mutation', async () => {
    const client = newClient()
    client.getMutationCache().build(
      client,
      { mutationKey: ['send'] },
      {
        context: undefined,
        data: undefined,
        error: null,
        failureCount: 0,
        failureReason: null,
        isPaused: true,
        status: 'pending',
        variables: { signedTransaction: 'signed-bytes' },
        submittedAt: Date.now(),
      },
    )
    await save(client)

    expect(mmkv.contains(QUERY_CACHE_KEY)).toBe(false)
  })

  it('drops on restore collectables more than 7 days old', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables, {
      updatedAt: Date.now() - 6 * DAY,
    })
    await save(client)

    jest.advanceTimersByTime(2 * DAY)
    const restored = await restore()

    expect(restored.getQueryData(collectablesKey)).toBeUndefined()
  })

  it('saves no collectables fetched more than 7 days ago', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables, {
      updatedAt: Date.now() - 7 * DAY - 1,
    })
    await save(client)

    const restored = await restore()

    expect(restored.getQueryData(collectablesKey)).toBeUndefined()
    expect(mmkv.contains(QUERY_CACHE_KEY)).toBe(false)
  })

  it('removes the saved cache when no query is left to save', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    await save(client)
    expect(mmkv.contains(QUERY_CACHE_KEY)).toBe(true)

    client.removeQueries({ queryKey: collectablesKey })
    client.setQueryData(['notifications'], ['note'])
    await save(client)

    expect(mmkv.contains(QUERY_CACHE_KEY)).toBe(false)
  })
})
