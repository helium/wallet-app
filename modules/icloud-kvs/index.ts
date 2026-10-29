import { NativeModule, requireOptionalNativeModule } from 'expo'

declare class ICloudKVSModule extends NativeModule<{ onChange: () => void }> {
  getString(key: string): string | null

  setString(key: string, value: string): void

  remove(keys: string[]): void
}

// iOS only. Android has no iCloud key-value store, so the module is null there.
const ICloudKVS = requireOptionalNativeModule<ICloudKVSModule>('ICloudKVS')

const requireICloudKVS = () => {
  if (!ICloudKVS) throw new Error('ICloudKVS native module is not linked')
  return ICloudKVS
}

// Reads one string from NSUbiquitousKeyValueStore. Only iOS calls it; Android
// reads AsyncStorage. Throws when the module is missing, so a broken build
// does not look like a fresh install.
export const getICloudKVSString = (key: string) =>
  requireICloudKVS().getString(key)

// Writes one string to NSUbiquitousKeyValueStore and syncs, so a reinstall or
// a new device restores the current value.
export const setICloudKVSString = (key: string, value: string) =>
  requireICloudKVS().setString(key, value)

// Removes keys from NSUbiquitousKeyValueStore and syncs, so sign-out also
// clears them on other devices and on a reinstall.
export const removeICloudKVSKeys = (keys: string[]) =>
  requireICloudKVS().remove(keys)

// Calls the listener when iCloud changes the store from outside the app: another
// device's write, or the first download after an install. Returns the unsubscribe.
export const subscribeICloudKVSChanges = (listener: () => void) => {
  const subscription = requireICloudKVS().addListener('onChange', listener)
  return () => subscription.remove()
}
