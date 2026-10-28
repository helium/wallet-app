import { requireOptionalNativeModule } from 'expo'

type ICloudKVSModule = {
  getString(key: string): string | null
}

// iOS only. Android has no iCloud key-value store, so the module is null there.
const ICloudKVS = requireOptionalNativeModule<ICloudKVSModule>('ICloudKVS')

// Reads one string from NSUbiquitousKeyValueStore. Read-only: the app no longer
// writes iCloud, and older app versions on other devices keep their data.
export const getICloudKVSString = (key: string) =>
  ICloudKVS?.getString(key) ?? null
