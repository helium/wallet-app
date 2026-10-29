import type AsyncStorageStatic from '@react-native-async-storage/async-storage'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import type { CSAccount, CSAccounts, CSToken } from '../cloudStorage'

const mockPlatform = { OS: 'ios' }
const mockICloud = new Map<string, string>()
let mockICloudError: Error | undefined

jest.mock('react-native', () => ({ Platform: mockPlatform }))
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.requireActual(
    'react-native-mmkv/lib/createMMKV/createMockMMKV',
  ).createMockMMKV,
}))
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
}))
jest.mock('expo-secure-store', () => {
  const items = new Map<string, string>()
  return {
    setItemAsync: async (key: string, value: string) => {
      items.set(key, value)
    },
    getItemAsync: async (key: string) => items.get(key) ?? null,
  }
})
jest.mock('../../../modules/icloud-kvs', () => ({
  getICloudKVSString: (key: string) => {
    if (mockICloudError) throw mockICloudError
    return mockICloud.get(key) ?? null
  },
}))

// Nested redux-persist configs that the Redux store still uses
const NESTED_PERSIST_KEYS = ['persist:solana', 'persist:notifications']
// react-native-icloudstore put this prefix on every iCloud key
const ICLOUD_PREFIX = '@com.manicakes.iCloudStorage/'

const account: CSAccount = {
  alias: 'Main',
  address: '13BnsQ6hHjfvJXYxwpWeMaD5Ep5nN1b4BPRJy4AqBkDq3mTF8Sk',
  solanaAddress: 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
  netType: 0,
  version: 'v1',
}
const contact: CSAccount = {
  alias: 'Friend',
  address: '14Wfp1GKy2Wb5YCVhXkBF7NomJCpqtxhgzS4AuPGkAN5RNm5LYU',
  netType: 0,
}
const accounts: CSAccounts = { [account.address]: account }
const visibleTokens: CSToken = {
  [account.address]: ['hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'],
}
const browser = {
  [account.solanaAddress as string]: {
    favorites: ['https://heliumvote.com'],
    recents: ['https://jup.ag'],
  },
}

// What the old Redux store persisted, written by redux-persist itself with the
// old root config, so the fixture has the real persist:root format.
const writeLegacyReduxState = async (
  AsyncStorage: typeof AsyncStorageStatic,
  state: { app: object; auth: object; browser: object },
) => {
  const reducer = persistReducer(
    // timeout 0 turns off the rehydrate timer, which keeps Jest open
    { key: 'root', storage: AsyncStorage, version: 1, timeout: 0 },
    combineReducers({
      app: () => state.app,
      auth: () => state.auth,
      browser: () => state.browser,
    }),
  )
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  })
  const persistor = persistStore(store)
  await new Promise<void>((resolve) => {
    const check = () => persistor.getState().bootstrapped && resolve()
    persistor.subscribe(check)
    check()
  })
  await persistor.flush()
  await AsyncStorage.multiSet([
    ['persist:solana', '{}'],
    ['persist:balances', '{}'],
    ['persist:notifications', '{}'],
  ])
}

// What the old cloudStorage.ts wrote for the five cloud keys
const legacyCloudItems: Array<[string, string]> = [
  ['accounts', JSON.stringify(accounts)],
  ['contacts', JSON.stringify([contact])],
  ['lastViewedNotifications', (1700000000).toString()],
  ['visibleTokens', JSON.stringify(visibleTokens)],
  ['defaultAccountAddress', account.address],
]

// Fresh modules per test, so each test starts with empty storage and stores
/* eslint-disable global-require, @typescript-eslint/no-var-requires */
const load = () => ({
  ...(require('../importLegacyState') as typeof import('../importLegacyState')),
  ...(require('../mmkv') as typeof import('../mmkv')),
  ...(require('../../store/appStore') as typeof import('../../store/appStore')),
  ...(require('../../store/browserStore') as typeof import('../../store/browserStore')),
  ...(require('../../store/cloudStore') as typeof import('../../store/cloudStore')),
  AsyncStorage: (
    require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage')
  ).default,
  SecureStore:
    require('expo-secure-store') as typeof import('expo-secure-store'),
})
/* eslint-enable global-require, @typescript-eslint/no-var-requires */

beforeEach(() => {
  jest.resetModules()
  mockICloud.clear()
  mockICloudError = undefined
  mockPlatform.OS = 'ios'
})

const legacyRedux = {
  app: { showConnectedWallets: false, showBanner: false, cluster: 'devnet' },
  auth: { apiToken: 'legacy-api-token' },
  browser,
}

describe('importLegacyState', () => {
  it('imports the old Redux state and the iCloud keys on iOS', async () => {
    const m = load()
    await writeLegacyReduxState(m.AsyncStorage, legacyRedux)
    legacyCloudItems.forEach(([key, value]) =>
      mockICloud.set(`${ICLOUD_PREFIX}${key}`, value),
    )

    await m.importLegacyState()

    expect(m.useAppStore.getState().cluster).toBe('devnet')
    expect(m.useAppStore.getState().showBanner).toBe(false)
    expect(m.useBrowserStore.getState().byAccount).toEqual(browser)
    expect(m.useCloudStore.getState()).toEqual({
      accounts,
      contacts: [contact],
      lastViewedNotifications: 1700000000,
      visibleTokens,
      defaultAccountAddress: account.address,
    })
    expect(await m.SecureStore.getItemAsync('walletApiToken')).toBeNull()
    expect(await m.AsyncStorage.getItem('persist:root')).toBeNull()
    expect(await m.AsyncStorage.getItem('persist:balances')).toBeNull()
    expect(await m.AsyncStorage.multiGet(NESTED_PERSIST_KEYS)).toEqual(
      NESTED_PERSIST_KEYS.map((key) => [key, '{}']),
    )
    expect(m.mmkv.getBoolean(m.LEGACY_IMPORT_DONE_KEY)).toBe(true)
    expect(m.mmkv.getAllKeys().sort()).toEqual(
      ['app', 'browser', 'cloud', m.LEGACY_IMPORT_DONE_KEY].sort(),
    )
  })

  it('reads the five cloud keys from AsyncStorage on Android', async () => {
    mockPlatform.OS = 'android'
    const m = load()
    await writeLegacyReduxState(m.AsyncStorage, legacyRedux)
    await m.AsyncStorage.multiSet(legacyCloudItems)

    await m.importLegacyState()

    expect(m.useCloudStore.getState()).toEqual({
      accounts,
      contacts: [contact],
      lastViewedNotifications: 1700000000,
      visibleTokens,
      defaultAccountAddress: account.address,
    })
    expect(m.useAppStore.getState().cluster).toBe('devnet')
  })

  it('does nothing once the import has run', async () => {
    const m = load()
    m.mmkv.set(m.LEGACY_IMPORT_DONE_KEY, true)
    await writeLegacyReduxState(m.AsyncStorage, legacyRedux)
    legacyCloudItems.forEach(([key, value]) =>
      mockICloud.set(`${ICLOUD_PREFIX}${key}`, value),
    )

    await m.importLegacyState()

    expect(m.useAppStore.getState().cluster).toBeUndefined()
    expect(m.useCloudStore.getState().accounts).toBeUndefined()
    expect(await m.AsyncStorage.getItem('persist:root')).not.toBeNull()
  })

  it('marks a fresh install as imported and leaves the stores empty', async () => {
    const m = load()

    await m.importLegacyState()

    expect(m.mmkv.getAllKeys()).toEqual([m.LEGACY_IMPORT_DONE_KEY])
    expect(m.useAppStore.getState().showBanner).toBe(true)
    expect(m.useBrowserStore.getState().byAccount).toEqual({})
    expect(m.useCloudStore.getState()).toEqual({})
  })

  it('skips an unreadable cloud value and imports the rest', async () => {
    const m = load()
    await writeLegacyReduxState(m.AsyncStorage, legacyRedux)
    legacyCloudItems.forEach(([key, value]) =>
      mockICloud.set(`${ICLOUD_PREFIX}${key}`, value),
    )
    mockICloud.set(`${ICLOUD_PREFIX}accounts`, '{not json')

    await m.importLegacyState()

    expect(m.useCloudStore.getState().accounts).toBeUndefined()
    expect(m.useCloudStore.getState()).toEqual({
      contacts: [contact],
      lastViewedNotifications: 1700000000,
      visibleTokens,
      defaultAccountAddress: account.address,
    })
    expect(m.useAppStore.getState().cluster).toBe('devnet')
    expect(m.mmkv.getBoolean(m.LEGACY_IMPORT_DONE_KEY)).toBe(true)
  })

  it('skips an unreadable persist:root and imports the cloud keys', async () => {
    const m = load()
    await m.AsyncStorage.setItem('persist:root', '{not json')
    legacyCloudItems.forEach(([key, value]) =>
      mockICloud.set(`${ICLOUD_PREFIX}${key}`, value),
    )

    await m.importLegacyState()

    expect(m.useAppStore.getState().cluster).toBeUndefined()
    expect(m.useAppStore.getState().showBanner).toBe(true)
    expect(m.useCloudStore.getState()).toEqual({
      accounts,
      contacts: [contact],
      lastViewedNotifications: 1700000000,
      visibleTokens,
      defaultAccountAddress: account.address,
    })
    expect(m.mmkv.getBoolean(m.LEGACY_IMPORT_DONE_KEY)).toBe(true)
  })

  it('skips an unreadable slice inside a valid persist:root', async () => {
    const m = load()
    await m.AsyncStorage.setItem(
      'persist:root',
      JSON.stringify({
        app: '{not json',
        browser: JSON.stringify(browser),
        _persist: JSON.stringify({ version: 1, rehydrated: true }),
      }),
    )
    legacyCloudItems.forEach(([key, value]) =>
      mockICloud.set(`${ICLOUD_PREFIX}${key}`, value),
    )

    await m.importLegacyState()

    expect(m.useAppStore.getState().cluster).toBeUndefined()
    expect(m.useAppStore.getState().showBanner).toBe(true)
    expect(m.useBrowserStore.getState().byAccount).toEqual(browser)
    expect(m.useCloudStore.getState()).toEqual({
      accounts,
      contacts: [contact],
      lastViewedNotifications: 1700000000,
      visibleTokens,
      defaultAccountAddress: account.address,
    })
    expect(m.mmkv.getBoolean(m.LEGACY_IMPORT_DONE_KEY)).toBe(true)
  })

  it('keeps the default showBanner when the old app slice lacks it', async () => {
    const m = load()
    await writeLegacyReduxState(m.AsyncStorage, {
      ...legacyRedux,
      app: { cluster: 'devnet' },
    })

    await m.importLegacyState()

    expect(m.useAppStore.getState().cluster).toBe('devnet')
    expect(m.useAppStore.getState().showBanner).toBe(true)
  })

  it('retries a failed import on the next call', async () => {
    const m = load()
    await writeLegacyReduxState(m.AsyncStorage, legacyRedux)
    legacyCloudItems.forEach(([key, value]) =>
      mockICloud.set(`${ICLOUD_PREFIX}${key}`, value),
    )
    mockICloudError = new Error('ICloudKVS native module is not linked')

    await expect(m.importLegacyState()).rejects.toThrow(
      'ICloudKVS native module is not linked',
    )
    expect(m.mmkv.getBoolean(m.LEGACY_IMPORT_DONE_KEY)).toBeUndefined()
    expect(await m.AsyncStorage.getItem('persist:root')).not.toBeNull()

    mockICloudError = undefined
    await m.importLegacyState()

    expect(m.useCloudStore.getState().accounts).toEqual(accounts)
    expect(m.mmkv.getBoolean(m.LEGACY_IMPORT_DONE_KEY)).toBe(true)
  })
})
