import { resetAppState } from '../resetAppState'
import { LEGACY_IMPORT_DONE_KEY, mmkv } from '../mmkv'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { useBrowserStore } from '../../store/browserStore'
import { useCloudStore } from '../../store/cloudStore'
import { persistor } from '../../store/persistence'
import { queryClient } from '../../utils/queryClient'

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.requireActual(
    'react-native-mmkv/lib/createMMKV/createMockMMKV',
  ).createMockMMKV,
}))
jest.mock('../../store/persistence', () => ({
  persistor: { purge: jest.fn().mockResolvedValue(undefined) },
}))

const solanaAddress = 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4'

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
})
