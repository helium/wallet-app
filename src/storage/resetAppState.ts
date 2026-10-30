import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StoreApi } from 'zustand'
import { useAppStore } from '../store/appStore'
import { useAuthStore } from '../store/authStore'
import { useBrowserStore } from '../store/browserStore'
import { useCloudStore } from '../store/cloudStore'
import { queryClient } from '../utils/queryClient'
import {
  LEGACY_PERSIST_KEYS,
  removeLegacyCloudItems,
} from './importLegacyState'
import { LEGACY_IMPORT_DONE_KEY, mmkv } from './mmkv'

const resetStore = <T>(store: StoreApi<T>) =>
  store.setState(store.getInitialState(), true)

/**
 * Clears all app state on sign-out. Keeps only the import-done marker, so the
 * old Redux and cloud data is not imported again on this device. Removes the
 * old cloud keys, so a reinstall or a new device does not import them either.
 */
export const resetAppState = async () => {
  await removeLegacyCloudItems()
  resetStore(useAppStore)
  resetStore(useAuthStore)
  resetStore(useBrowserStore)
  resetStore(useCloudStore)
  // After the store resets, which write their initial state back to MMKV
  mmkv
    .getAllKeys()
    .filter((key) => key !== LEGACY_IMPORT_DONE_KEY)
    .forEach((key) => mmkv.remove(key))
  queryClient.clear()
  // Old Redux keys survive on a device that imported before they were dropped,
  // and refresh builds wrote persist:root.v2
  await AsyncStorage.multiRemove(LEGACY_PERSIST_KEYS).catch((error) =>
    console.warn('Could not remove the old Redux state', error),
  )
}
