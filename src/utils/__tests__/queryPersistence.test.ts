import { QueryClient } from '@tanstack/react-query'
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client'
import { mmkv } from '../../storage/mmkv'
import { useCloudStore } from '../../store/cloudStore'
import { createQueryClient } from '../queryClient'
import { QUERY_CACHE_KEY, queryPersistOptions } from '../queryPersistence'

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.requireActual(
    'react-native-mmkv/lib/createMMKV/createMockMMKV',
  ).createMockMMKV,
}))

const DAY = 24 * 60 * 60 * 1000
const heliumAddress = '13BnsQ6hHjfvJXYxwpWeMaD5Ep5nN1b4BPRJy4AqBkDq3mTF8Sk'
const collectablesKey = [
  'collectables',
  'mainnet-beta',
  'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
]
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
      [heliumAddress]: { alias: 'Main', address: heliumAddress, netType: 0 },
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

  it('restores a cache saved 7 days ago', async () => {
    const client = newClient()
    client.setQueryData(collectablesKey, collectables)
    await save(client)

    jest.advanceTimersByTime(7 * DAY)
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
