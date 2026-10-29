import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { resetAppState } from '../resetAppState'
import { importLegacyState } from '../importLegacyState'
import { LEGACY_IMPORT_DONE_KEY, mmkv } from '../mmkv'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { useBrowserStore } from '../../store/browserStore'
import { useCloudStore } from '../../store/cloudStore'
import { persistor } from '../../store/persistence'
import { queryClient } from '../../utils/queryClient'

const mockICloud = new Map<string, string>()

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
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
jest.mock('../../../modules/icloud-kvs', () => ({
  getICloudKVSString: (key: string) => mockICloud.get(key) ?? null,
  removeICloudKVSKeys: (keys: string[]) =>
    keys.forEach((key) => mockICloud.delete(key)),
}))
jest.mock('../../store/persistence', () => ({
  persistor: { purge: jest.fn().mockResolvedValue(undefined) },
}))

const solanaAddress = 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4'
const heliumAddress = '13BnsQ6hHjfvJXYxwpWeMaD5Ep5nN1b4BPRJy4AqBkDq3mTF8Sk'

// What the old cloudStorage.ts wrote for the five cloud keys
const legacyCloudItems: Array<[string, string]> = [
  [
    'accounts',
    JSON.stringify({
      [heliumAddress]: { alias: 'Main', address: heliumAddress, netType: 0 },
    }),
  ],
  ['contacts', JSON.stringify([])],
  ['lastViewedNotifications', (1700000000).toString()],
  ['visibleTokens', JSON.stringify({})],
  ['defaultAccountAddress', heliumAddress],
]
// react-native-icloudstore put this prefix on every iCloud key
const ICLOUD_PREFIX = '@com.manicakes.iCloudStorage/'

beforeEach(() => {
  mockICloud.clear()
  Platform.OS = 'ios'
})

describe('resetAppState', () => {
  it('leaves the import-done marker as the only stored key', async () => {
    mmkv.set(LEGACY_IMPORT_DONE_KEY, true)
    useAppStore.getState().setCluster('devnet')
    useAppStore.getState().setShowBanner(false)
    useAppStore.getState().toggleConnectedWallets()
    useAuthStore.setState({ apiToken: 'token' })
    useBrowserStore.getState().addFavorite(solanaAddress, 'https://jup.ag')
    useBrowserStore.getState().addRecent(solanaAddress, 'https://jup.ag')
    useCloudStore.setState({
      defaultAccountAddress: solanaAddress,
      lastViewedNotifications: 1700000000,
    })
    queryClient.setQueryData(['balance'], 1)
    expect(mmkv.getAllKeys().sort()).toEqual(
      ['app', 'browser', 'cloud', LEGACY_IMPORT_DONE_KEY].sort(),
    )

    await resetAppState()

    expect(mmkv.getAllKeys()).toEqual([LEGACY_IMPORT_DONE_KEY])
    expect(mmkv.getBoolean(LEGACY_IMPORT_DONE_KEY)).toBe(true)
    expect(useAppStore.getState()).toMatchObject({
      showConnectedWallets: false,
      showBanner: true,
    })
    expect(useAppStore.getState().cluster).toBeUndefined()
    expect(useAuthStore.getState()).toEqual({})
    expect(useBrowserStore.getState().byAccount).toEqual({})
    expect(useCloudStore.getState()).toEqual({})
    expect(queryClient.getQueryCache().getAll()).toEqual([])
    expect(persistor.purge).toHaveBeenCalledTimes(1)
  })

  it('removes the iCloud keys, so a reinstall imports no signed-out wallet', async () => {
    mmkv.set(LEGACY_IMPORT_DONE_KEY, true)
    legacyCloudItems.forEach(([key, value]) =>
      mockICloud.set(`${ICLOUD_PREFIX}${key}`, value),
    )
    mockICloud.set('otherKey', 'kept')

    await resetAppState()

    expect([...mockICloud.entries()]).toEqual([['otherKey', 'kept']])

    // A reinstall or a new device starts with empty MMKV and runs the import
    mmkv.clearAll()
    await importLegacyState()

    expect(useCloudStore.getState()).toEqual({})
    expect(mmkv.getAllKeys()).toEqual([LEGACY_IMPORT_DONE_KEY])
  })

  it('removes the five cloud keys from AsyncStorage on Android', async () => {
    Platform.OS = 'android'
    mmkv.set(LEGACY_IMPORT_DONE_KEY, true)
    await AsyncStorage.multiSet([...legacyCloudItems, ['persist:solana', '{}']])

    await resetAppState()

    expect(await AsyncStorage.getAllKeys()).toEqual(['persist:solana'])
  })
})
