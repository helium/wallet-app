import { requireOptionalNativeModule } from 'expo'

type ICloudKVSModule = {
  getString(key: string): string | null
  remove(keys: string[]): void
}

// iOS only. Android has no iCloud key-value store, so the module is null there.
const ICloudKVS = requireOptionalNativeModule<ICloudKVSModule>('ICloudKVS')

const requireICloudKVS = () => {
  if (!ICloudKVS) throw new Error('ICloudKVS native module is not linked')
  return ICloudKVS
}

// Reads one string from NSUbiquitousKeyValueStore. The app no longer writes
// iCloud values; it only removes them on sign-out. Only iOS calls it; Android
// reads AsyncStorage. Throws when the module is missing, so a broken build
// does not look like a fresh install.
export const getICloudKVSString = (key: string) =>
  requireICloudKVS().getString(key)

// Removes keys from NSUbiquitousKeyValueStore and syncs, so sign-out also
// clears them on other devices and on a reinstall.
export const removeICloudKVSKeys = (keys: string[]) =>
  requireICloudKVS().remove(keys)
