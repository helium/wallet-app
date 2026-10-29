import { requireOptionalNativeModule } from 'expo'

type ICloudKVSModule = {
  getString(key: string): string | null
}

// iOS only. Android has no iCloud key-value store, so the module is null there.
const ICloudKVS = requireOptionalNativeModule<ICloudKVSModule>('ICloudKVS')

// Reads one string from NSUbiquitousKeyValueStore. Read-only: the app no longer
// writes iCloud, and older app versions on other devices keep their data. Only
// iOS calls it; Android reads AsyncStorage. Throws when the module is missing,
// so a broken build does not look like a fresh install.
export const getICloudKVSString = (key: string) => {
  if (!ICloudKVS) throw new Error('ICloudKVS native module is not linked')
  return ICloudKVS.getString(key)
}
