import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Cluster } from '@solana/web3.js'
import { Platform } from 'react-native'
import {
  getICloudKVSString,
  removeICloudKVSKeys,
  setICloudKVSString,
  subscribeICloudKVSChanges,
} from '../../modules/icloud-kvs'
import { useAppStore } from '../store/appStore'
import { BrowserDetails, useBrowserStore } from '../store/browserStore'
import { CloudState, useCloudStore } from '../store/cloudStore'
import { LEGACY_IMPORT_DONE_KEY, mmkv } from './mmkv'

// The old redux-persist root key and its three nested persist configs
export const LEGACY_PERSIST_KEYS = [
  'persist:root',
  'persist:solana',
  'persist:balances',
  'persist:notifications',
]

// react-native-icloudstore stored every iCloud key under this prefix
const ICLOUD_PREFIX = '@com.manicakes.iCloudStorage/'

// iOS kept these in iCloud key-value storage, Android in AsyncStorage
const readCloudItem = (key: keyof CloudState) =>
  Platform.OS === 'ios'
    ? getICloudKVSString(`${ICLOUD_PREFIX}${key}`)
    : AsyncStorage.getItem(key)

// The string the old cloudStorage.ts stored for each CloudState key. Typed
// over every key, so a new cloud key fails to compile until listed here.
type CloudItems = Required<CloudState>
const formatCloudItem: {
  [K in keyof CloudItems]: (value: CloudItems[K]) => string
} = {
  accounts: JSON.stringify,
  contacts: JSON.stringify,
  lastViewedNotifications: (time) => time.toString(),
  visibleTokens: JSON.stringify,
  defaultAccountAddress: (address) => address,
}

const CLOUD_KEYS = Object.keys(formatCloudItem)

const writeICloudItem = <K extends keyof CloudItems>(
  key: K,
  value: CloudItems[K] | undefined,
) =>
  value === undefined
    ? removeICloudKVSKeys([`${ICLOUD_PREFIX}${key}`])
    : setICloudKVSString(`${ICLOUD_PREFIX}${key}`, formatCloudItem[key](value))

/**
 * Keeps the iCloud keys current on iOS, in the old format, so a reinstall or
 * a new device imports the wallets and contacts the user has now. Android
 * turns off backup (allowBackup="false"), so it has nothing to keep current.
 */
export const writeCloudItems = (state: CloudState) => {
  if (Platform.OS !== 'ios') return
  const keys = Object.keys(state) as Array<keyof CloudState>
  keys.forEach((key) => writeICloudItem(key, state[key]))
}

/**
 * Calls the listener when another device on the Apple ID changes the iCloud
 * keys, or when the first download from iCloud lands. Returns the unsubscribe.
 * Android has no shared keys, so it never calls the listener.
 */
export const subscribeCloudItemChanges = (listener: () => void) =>
  Platform.OS === 'ios' ? subscribeICloudKVSChanges(listener) : () => {}

/**
 * Removes the old cloud keys on sign-out, so a reinstall or a new device does
 * not import the signed-out wallets.
 */
export const removeLegacyCloudItems = () =>
  Platform.OS === 'ios'
    ? removeICloudKVSKeys(CLOUD_KEYS.map((key) => `${ICLOUD_PREFIX}${key}`))
    : AsyncStorage.multiRemove(CLOUD_KEYS)

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

/**
 * Reads the five cloud keys in the old format. An unreadable or missing value
 * is undefined.
 */
export const readCloudItems = async (): Promise<CloudState> => {
  const [
    rawAccounts,
    rawContacts,
    rawLastViewed,
    rawVisibleTokens,
    defaultAccountAddress,
  ] = await Promise.all([
    readCloudItem('accounts'),
    readCloudItem('contacts'),
    readCloudItem('lastViewedNotifications'),
    readCloudItem('visibleTokens'),
    readCloudItem('defaultAccountAddress'),
  ])
  return {
    accounts: parseJSON(rawAccounts),
    contacts: parseJSON(rawContacts),
    lastViewedNotifications: parseTimestamp(rawLastViewed),
    visibleTokens: parseJSON(rawVisibleTokens),
    defaultAccountAddress: defaultAccountAddress || undefined,
  }
}

const runImport = async () => {
  if (mmkv.getBoolean(LEGACY_IMPORT_DONE_KEY)) return

  const [rawRoot, cloud] = await Promise.all([
    AsyncStorage.getItem('persist:root'),
    readCloudItems(),
  ])

  // Parse everything before writing. An unreadable value is skipped, not imported.
  const { app, browser } = parseRoot(rawRoot)

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

  await AsyncStorage.multiRemove(LEGACY_PERSIST_KEYS)
  mmkv.set(LEGACY_IMPORT_DONE_KEY, true)
}

let importing: Promise<void> | undefined

/**
 * Copies the old Redux and cloud data into the Zustand stores once, on the
 * first launch of a build with this code. Every call shares one run, so cloud
 * storage reads can wait for it. Run it before the app renders.
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
