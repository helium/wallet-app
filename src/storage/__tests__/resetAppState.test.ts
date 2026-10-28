import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistQueryClientSave } from '@tanstack/react-query-persist-client'
import { resetAppState } from '../resetAppState'
import { LEGACY_IMPORT_DONE_KEY, mmkv } from '../mmkv'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { useBrowserStore } from '../../store/browserStore'
import { useCloudStore } from '../../store/cloudStore'
import { queryClient } from '../../utils/queryClient'
import {
  QUERY_CACHE_KEY,
  queryPersistOptions,
} from '../../utils/queryPersistence'

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
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
jest.mock('expo-secure-store', () => ({}))
jest.mock('../../../modules/icloud-kvs', () => ({}))

// Old redux-persist keys: the root config and its three nested configs
const LEGACY_PERSIST_KEYS = [
  'persist:root',
  'persist:solana',
  'persist:balances',
  'persist:notifications',
]

const solanaAddress = 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4'

describe('resetAppState', () => {
  it('leaves the import-done marker as the only stored key', async () => {
    mmkv.set(LEGACY_IMPORT_DONE_KEY, true)
    // Left behind when a legacy import failed
    await AsyncStorage.multiSet(LEGACY_PERSIST_KEYS.map((key) => [key, '{}']))
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
    queryClient.setQueryData(['collectables', 'devnet', solanaAddress], {})
    await persistQueryClientSave({ queryClient, ...queryPersistOptions })
    expect(mmkv.getAllKeys().sort()).toEqual(
      [
        'app',
        'browser',
        'cloud',
        QUERY_CACHE_KEY,
        LEGACY_IMPORT_DONE_KEY,
      ].sort(),
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
    expect(await AsyncStorage.multiGet(LEGACY_PERSIST_KEYS)).toEqual(
      LEGACY_PERSIST_KEYS.map((key) => [key, null]),
    )
  })
})
