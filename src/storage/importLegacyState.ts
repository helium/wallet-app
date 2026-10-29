import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Cluster } from '@solana/web3.js'
import { Platform } from 'react-native'
import { getICloudKVSString } from '../../modules/icloud-kvs'
import { useAppStore } from '../store/appStore'
import { BrowserDetails, useBrowserStore } from '../store/browserStore'
import { CloudState, useCloudStore } from '../store/cloudStore'
import { LEGACY_IMPORT_DONE_KEY, mmkv } from './mmkv'

// The old redux-persist root key. The solana, balances and notifications
// configs stay in use by the Redux store, so the import keeps them.
const LEGACY_ROOT_KEY = 'persist:root'

// react-native-icloudstore stored every iCloud key under this prefix
const ICLOUD_PREFIX = '@com.manicakes.iCloudStorage/'

// iOS kept these in iCloud key-value storage, Android in AsyncStorage
const readCloudItem = (key: keyof CloudState) =>
  Platform.OS === 'ios'
    ? getICloudKVSString(`${ICLOUD_PREFIX}${key}`)
    : AsyncStorage.getItem(key)

type LegacyRootState = {
  app?: { showBanner?: boolean; cluster?: Cluster }
  browser?: Record<string, BrowserDetails>
}

const parseJSON = <T>(raw: string | null): T | undefined => {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch (e) {
    console.warn('Skipping unreadable legacy value', e)
    return undefined
  }
}

// redux-persist stores each top-level slice as its own JSON string
const parseRoot = (raw: string | null): LegacyRootState => {
  const root = parseJSON<Record<string, string>>(raw)
  if (!root) return {}
  const slice = (key: string) => parseJSON(root[key] ?? null)
  return {
    app: slice('app') as LegacyRootState['app'],
    browser: slice('browser') as LegacyRootState['browser'],
  }
}

const parseTimestamp = (raw: string | null) => {
  const value = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isNaN(value) ? undefined : value
}

const runImport = async () => {
  if (mmkv.getBoolean(LEGACY_IMPORT_DONE_KEY)) return

  const [
    rawRoot,
    rawAccounts,
    rawContacts,
    rawLastViewed,
    rawVisibleTokens,
    defaultAccountAddress,
  ] = await Promise.all([
    AsyncStorage.getItem(LEGACY_ROOT_KEY),
    readCloudItem('accounts'),
    readCloudItem('contacts'),
    readCloudItem('lastViewedNotifications'),
    readCloudItem('visibleTokens'),
    readCloudItem('defaultAccountAddress'),
  ])

  // Parse everything before writing. An unreadable value is skipped, not imported.
  const { app, browser } = parseRoot(rawRoot)
  const cloud: CloudState = {
    accounts: parseJSON(rawAccounts),
    contacts: parseJSON(rawContacts),
    lastViewedNotifications: parseTimestamp(rawLastViewed),
    visibleTokens: parseJSON(rawVisibleTokens),
    defaultAccountAddress: defaultAccountAddress || undefined,
  }

  if (app) {
    const appEntries = Object.entries({
      cluster: app.cluster,
      showBanner: app.showBanner,
    }).filter(([, v]) => v !== undefined)
    useAppStore.setState(Object.fromEntries(appEntries))
  }
  if (browser) useBrowserStore.setState({ byAccount: browser })
  const cloudEntries = Object.entries(cloud).filter(([, v]) => v !== undefined)
  if (cloudEntries.length) {
    useCloudStore.setState(Object.fromEntries(cloudEntries))
  }

  await AsyncStorage.removeItem(LEGACY_ROOT_KEY)
  mmkv.set(LEGACY_IMPORT_DONE_KEY, true)
}

let importing: Promise<void> | undefined

/**
 * Copies the old Redux and cloud data into the Zustand stores once, on the
 * first launch of a build with this code. Every call shares one run, so cloud
 * storage reads can wait for it. Run it before redux-persist rehydrates.
 * A failed run is retried on the next call.
 */
export const importLegacyState = () => {
  if (!importing) {
    importing = runImport().catch((e) => {
      importing = undefined
      throw e
    })
  }
  return importing
}
