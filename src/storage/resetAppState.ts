import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StoreApi } from 'zustand'
import { useAppStore } from '../store/appStore'
import { useAuthStore } from '../store/authStore'
import { useBrowserStore } from '../store/browserStore'
import { useCloudStore } from '../store/cloudStore'
import { queryClient } from '../utils/queryClient'
import { LEGACY_PERSIST_KEYS } from './importLegacyState'
import { LEGACY_IMPORT_DONE_KEY, mmkv } from './mmkv'

const resetStore = <T>(store: StoreApi<T>) =>
  store.setState(store.getInitialState(), true)

/**
 * Clears all app state on sign-out. Keeps only the import-done marker, so the
 * old Redux and cloud data is not imported again.
 */
export const resetAppState = async () => {
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
  // Old Redux state left behind by a failed import
  await AsyncStorage.multiRemove(LEGACY_PERSIST_KEYS)
}
