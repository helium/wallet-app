import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Cluster } from '@solana/web3.js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { getICloudKVSString } from '../../modules/icloud-kvs'
import { useAppStore } from '../store/appStore'
import { BrowserDetails, useBrowserStore } from '../store/browserStore'
import { CloudState, useCloudStore } from '../store/cloudStore'
import { LEGACY_IMPORT_DONE_KEY, mmkv } from './mmkv'

// The old redux-persist root key and its three nested persist configs
const LEGACY_PERSIST_KEYS = [
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

type LegacyRootState = {
  app?: { showBanner?: boolean; cluster?: Cluster }
  auth?: { apiToken?: string }
  browser?: Record<string, BrowserDetails>
}

// redux-persist stores each top-level slice as its own JSON string
const parseRoot = (raw: string | null): LegacyRootState => {
  if (!raw) return {}
  const root: Record<string, string> = JSON.parse(raw)
  const slice = (key: string) => (root[key] ? JSON.parse(root[key]) : undefined)
  return { app: slice('app'), auth: slice('auth'), browser: slice('browser') }
}

const parseJSON = <T>(raw: string | null) =>
  raw ? (JSON.parse(raw) as T) : undefined

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
    AsyncStorage.getItem('persist:root'),
    readCloudItem('accounts'),
    readCloudItem('contacts'),
    readCloudItem('lastViewedNotifications'),
    readCloudItem('visibleTokens'),
    readCloudItem('defaultAccountAddress'),
  ])

  // Parse everything before writing, so a bad value writes nothing
  const { app, auth, browser } = parseRoot(rawRoot)
  const cloud: CloudState = {
    accounts: parseJSON(rawAccounts),
    contacts: parseJSON(rawContacts),
    lastViewedNotifications: rawLastViewed
      ? Number.parseInt(rawLastViewed, 10)
      : undefined,
    visibleTokens: parseJSON(rawVisibleTokens),
    defaultAccountAddress: defaultAccountAddress || undefined,
  }

  if (app) {
    useAppStore.setState({ cluster: app.cluster, showBanner: app.showBanner })
  }
  if (browser) useBrowserStore.setState({ byAccount: browser })
  const cloudEntries = Object.entries(cloud).filter(([, v]) => v !== undefined)
  if (cloudEntries.length) {
    useCloudStore.setState(Object.fromEntries(cloudEntries))
  }
  if (auth?.apiToken) {
    // secureStorage.ts names this key SecureStorageKeys.WALLET_API_TOKEN
    await SecureStore.setItemAsync('walletApiToken', auth.apiToken)
  }

  await AsyncStorage.multiRemove(LEGACY_PERSIST_KEYS)
  mmkv.set(LEGACY_IMPORT_DONE_KEY, true)
}

let importing: Promise<void> | undefined

/**
 * Copies the old Redux and cloud data into the Zustand stores once, on the
 * first launch of a build with this code. Every call shares one run, so cloud
 * storage reads can wait for it. Run it before redux-persist rehydrates.
 */
export const importLegacyState = () => {
  if (!importing) importing = runImport()
  return importing
}
