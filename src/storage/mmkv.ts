import { createMMKV } from 'react-native-mmkv'
import type { StateStorage } from 'zustand/middleware'

export const mmkv = createMMKV()

// Set when the first-launch import of the old Redux and iCloud data ends.
// resetAppState keeps it, so a signed-out app does not import that data again.
export const LEGACY_IMPORT_DONE_KEY = 'legacyImportDone'

export const mmkvStateStorage: StateStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => {
    mmkv.remove(key)
  },
}
