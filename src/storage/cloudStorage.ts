import { NetTypes as NetType } from '@helium/address'
import { heliumAddressToSolAddress } from '@helium/spl-utils'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createHash } from 'crypto'
import { sortBy, values } from 'lodash'
import { Platform } from 'react-native'
import iCloudStorage from 'react-native-icloudstore'
import { getSecureAccount } from './secureStorage'

export type LedgerDevice = {
  id: string
  name: string
  type: 'usb' | 'bluetooth'
}

export type CSAccount = {
  alias: string
  address: string
  solanaAddress?: string
  netType: NetType.NetType
  derivationPath?: string
  ledgerDevice?: LedgerDevice
  accountIndex?: number
  // Hash of the mnemonic so we can group accts with the same mnemonic
  mnemonicHash?: string
  proposalCountByMint?: Record<string, number>
  proposalIdsSeenByMint?: Record<string, string[]>
  //
  version?: CSAccountVersion
}
export type CSAccountVersion = 'v1'
export type CSAccounts = Record<string, CSAccount>

export type CSToken = Record<string, string[]>

// for android we use AsyncStorage and auto backup to Google Drive using
// https://developer.android.com/guide/topics/data/autobackup
const CloudStorage = Platform.OS === 'ios' ? iCloudStorage : AsyncStorage

enum CloudStorageKeys {
  ACCOUNTS = 'accounts',
  CONTACTS = 'contacts',
  LAST_VIEWED_NOTIFICATIONS = 'lastViewedNotifications',
  VISIBLE_TOKENS = 'visibleTokens',
  DEFAULT_ACCOUNT_ADDRESS = 'defaultAccountAddress',
}

export const restoreVisibleTokens = async () => {
  const tokens = await getFromCloudStorage<CSToken>(
    CloudStorageKeys.VISIBLE_TOKENS,
  )

  return tokens
}

export const updateVisibleTokens = (tokens: CSToken) =>
  CloudStorage.setItem(CloudStorageKeys.VISIBLE_TOKENS, JSON.stringify(tokens))

export const sortAccounts = (
  accts: CSAccounts,
  defaultAddress: string | undefined | null,
) => {
  const acctList = values(accts)
  const sortedByAlias = sortBy(acctList, 'alias') || []
  if (defaultAddress) {
    const defaultAccount = sortedByAlias.find(
      (a) => a.address === defaultAddress,
    )
    if (defaultAccount) {
      // put default at beginning
      const filtered = sortedByAlias.filter((a) => a.address !== defaultAddress)
      filtered.unshift(defaultAccount)
      return filtered
    }
  }
  return sortedByAlias
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
  const defaultAccountAddress = await getCloudDefaultAccountAddress()

  let currentAccount: CSAccount | null = null
  if (Object.keys(csAccounts).length) {
    const [first] = sortAccounts(csAccounts, defaultAccountAddress)
    currentAccount = first
  }

  // One time migration
  let updatedVersions = false
  const changed = await Promise.all(
    Object.entries(csAccounts).map(async ([address, acct]) => {
      if (!acct.version) {
        updatedVersions = true
        // eslint-disable-next-line no-param-reassign
        acct.version = 'v1'
        const { mnemonic } = (await getSecureAccount(acct.address)) || {}
        if (mnemonic) {
          const mnemonicHash = createHash('sha256')
            .update(mnemonic.join(' '))
            .digest('hex')
          // eslint-disable-next-line no-param-reassign
          acct.mnemonicHash = mnemonicHash
          if (!acct.derivationPath) {
            // eslint-disable-next-line no-param-reassign
            acct.derivationPath = HELIUM_DERIVATION
          }
        }
      }

      if (!acct.solanaAddress) {
        // eslint-disable-next-line no-param-reassign
        acct.solanaAddress = heliumAddressToSolAddress(acct.address)
      }

      return { address, acct }
    }),
  )

  if (updatedVersions) {
    await updateCloudAccounts(
      changed.reduce((acc, { address, acct }) => {
        // eslint-disable-next-line no-param-reassign
        acc[address] = acct
        return acc
      }, {} as CSAccounts),
    )
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

export const updateLastViewedNotifications = async (time: number) =>
  CloudStorage.setItem(
    CloudStorageKeys.LAST_VIEWED_NOTIFICATIONS,
    time.toString(),
  )

export const getLastViewedNotifications = async () => {
  const timeString = await CloudStorage.getItem(
    CloudStorageKeys.LAST_VIEWED_NOTIFICATIONS,
  )
  return timeString ? Number.parseInt(timeString, 10) : undefined
}

export const setCloudDefaultAccountAddress = async (
  address: string | undefined,
) => {
  if (!address) {
    return CloudStorage.removeItem(CloudStorageKeys.DEFAULT_ACCOUNT_ADDRESS)
  }
  return CloudStorage.setItem(CloudStorageKeys.DEFAULT_ACCOUNT_ADDRESS, address)
}

export const getCloudDefaultAccountAddress = async () => {
  return CloudStorage.getItem(CloudStorageKeys.DEFAULT_ACCOUNT_ADDRESS)
}

export const signoutCloudStorage = () =>
  CloudStorage.multiRemove(Object.values(CloudStorageKeys))
