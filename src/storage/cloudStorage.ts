import { NetType } from '@helium/crypto-react-native'
import { sortBy, values } from 'lodash'
import { Platform } from 'react-native'
import iCloudStorage from 'react-native-icloudstore'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type CSAccount = {
  alias: string
  address: string
  netType: NetType.NetType
}
export type CSAccounts = Record<string, CSAccount>

// for android we use AsyncStorage and auto backup to Google Drive using
// https://developer.android.com/guide/topics/data/autobackup
const CloudStorage = Platform.OS === 'ios' ? iCloudStorage : AsyncStorage

enum CloudStorageKeys {
  ACCOUNTS = 'accounts',
  CONTACTS = 'contacts',
}

export const sortAccounts = (accts: CSAccounts) => {
  // TODO: We'll probably want to find a better way to order the accounts
  const acctList = values(accts)
  return sortBy(acctList, 'alias') || []
}
const getAccounts = async (): Promise<CSAccounts> => {
  const csAccounts = await CloudStorage.getItem(CloudStorageKeys.ACCOUNTS)
  if (!csAccounts) return {}

  return JSON.parse(csAccounts) as CSAccounts
}

export const restoreAccounts = async () => {
  const contacts = await getFromCloudStorage<CSAccount[]>(
    CloudStorageKeys.CONTACTS,
  )
  const csAccounts = await getAccounts()

  let currentAccount: CSAccount | null = null
  if (Object.keys(csAccounts).length) {
    const [first] = sortAccounts(csAccounts)
    currentAccount = first
  }

  return { csAccounts, current: currentAccount, contacts: contacts || [] }
}

const getFromCloudStorage = async <T>(
  key: CloudStorageKeys,
): Promise<T | undefined> => {
  const item = await CloudStorage.getItem(key)
  if (!item) return

  return JSON.parse(item) as T
}

export const updateCloudAccounts = (accounts: CSAccounts) =>
  CloudStorage.setItem(CloudStorageKeys.ACCOUNTS, JSON.stringify(accounts))

export const updateCloudContacts = (contacts: CSAccount[]) =>
  CloudStorage.setItem(CloudStorageKeys.CONTACTS, JSON.stringify(contacts))

export const signoutCloudStorage = () =>
  CloudStorage.multiRemove(Object.values(CloudStorageKeys))
