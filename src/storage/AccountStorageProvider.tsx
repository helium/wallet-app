import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Platform } from 'react-native'
import iCloudStorage from 'react-native-icloudstore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAsync } from 'react-async-hook'
import {
  Address,
  Keypair,
  Mnemonic,
  NetType,
} from '@helium/crypto-react-native'
import * as SecureStore from 'expo-secure-store'
import { sortBy, values } from 'lodash'
import { SecureStorageKeys } from './AppStorageProvider'
import { accountNetType, AccountNetTypeOpt } from '../utils/accountUtils'

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
  VIEW_TYPE = 'viewType',
}

export type AccountView = 'unified' | 'split'

export type SecureAccount = {
  mnemonic: string[]
  keypair: { pk: string; sk: string }
  address: string
  apiToken?: string
}
export type SecureAccounts = Record<string, SecureAccount>

const makeSignature = async (
  token: { address: string; time: number },
  keypair: Keypair,
) => {
  const stringifiedToken = JSON.stringify(token)
  const buffer = await keypair.sign(stringifiedToken)

  return buffer.toString('base64')
}

const makeWalletApiToken = async (address: string, keypair: Keypair) => {
  const time = Math.floor(Date.now() / 1000)

  const token = {
    address,
    time,
  }

  const signature = await makeSignature(token, keypair)

  const signedToken = { ...token, signature }
  return Buffer.from(JSON.stringify(signedToken)).toString('base64')
}

const getFromCloudStorage = async <T,>(
  key: CloudStorageKeys,
): Promise<T | undefined> => {
  const item = await CloudStorage.getItem(key)
  if (!item) return

  return JSON.parse(item) as T
}

const sortAccounts = (accts: CSAccounts) => {
  // TODO: We'll probably want to find a better way to order the accounts
  const acctList = values(accts)
  return sortBy(acctList, 'alias') || []
}

const useAccountStorageHook = () => {
  const [currentAccount, setCurrentAccount] = useState<
    CSAccount | null | undefined
  >(undefined)
  const [accounts, setAccounts] = useState<CSAccounts>()
  const [secureAccounts, setSecureAccounts] = useState<SecureAccounts>()
  const [contacts, setContacts] = useState<CSAccount[]>([])
  const [currentContact, setCurrentContact] = useState<CSAccount>()
  const [viewType, setViewType] = useState<AccountView>()

  const restored = useMemo(() => secureAccounts !== undefined, [secureAccounts])

  const accountAddresses = useMemo(
    () => Object.keys(accounts || {}),
    [accounts],
  )

  const hasAccounts = useMemo(
    () => !!accountAddresses.length,
    [accountAddresses.length],
  )

  const sortedAccounts = useMemo(() => sortAccounts(accounts || {}), [accounts])

  const sortedTestnetAccounts = useMemo(
    () => sortedAccounts.filter(({ netType }) => netType === NetType.TESTNET),
    [sortedAccounts],
  )

  const sortedMainnetAccounts = useMemo(
    () => sortedAccounts.filter(({ netType }) => netType === NetType.MAINNET),
    [sortedAccounts],
  )

  const sortedAccountsForNetType = useCallback(
    (netType: AccountNetTypeOpt) => {
      if (netType === NetType.MAINNET) return sortedMainnetAccounts
      if (netType === NetType.TESTNET) return sortedTestnetAccounts
      return sortedAccounts
    },
    [sortedAccounts, sortedMainnetAccounts, sortedTestnetAccounts],
  )

  const testnetContacts = useMemo(
    () => contacts.filter(({ netType }) => netType === NetType.TESTNET),
    [contacts],
  )

  const mainnetContacts = useMemo(
    () => contacts.filter(({ netType }) => netType === NetType.MAINNET),
    [contacts],
  )

  const contactsForNetType = useCallback(
    (netType: AccountNetTypeOpt) => {
      if (netType === NetType.MAINNET) return mainnetContacts
      if (netType === NetType.TESTNET) return testnetContacts
      return contacts
    },
    [contacts, mainnetContacts, testnetContacts],
  )

  useEffect(() => {
    if (!currentAccount || !currentContact) return

    if (currentAccount?.netType !== currentContact?.netType) {
      setCurrentContact(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount])

  const currentApiToken = useMemo(() => {
    if (!currentAccount?.address) return
    const secureAccount = secureAccounts?.[currentAccount.address]
    return secureAccount?.apiToken
  }, [currentAccount, secureAccounts])

  const getAccounts = useCallback(async (): Promise<CSAccounts> => {
    const csAccounts = await CloudStorage.getItem(CloudStorageKeys.ACCOUNTS)
    if (!csAccounts) return {}

    return JSON.parse(csAccounts) as CSAccounts
  }, [])

  const getSecureAccount = useCallback(
    async (address: string): Promise<SecureAccount | undefined> => {
      let item: string | null = null
      const secureAccount = secureAccounts?.[address]
      if (secureAccount) {
        return secureAccount
      }

      try {
        item = await SecureStore.getItemAsync(address)
      } catch (e) {
        console.error(e)
      }

      if (!item) return
      return JSON.parse(item) as SecureAccount
    },
    [secureAccounts],
  )

  const getKeypair = useCallback(async (): Promise<Keypair | undefined> => {
    if (!currentAccount?.address) {
      throw new Error('There is no currently selected account.')
    }
    const secureAccount = await getSecureAccount(currentAccount?.address)
    if (!secureAccount) {
      throw new Error(
        `Secure account for ${currentAccount.address} could not be found`,
      )
    }

    const netType = Address.fromB58(currentAccount.address)?.netType
    return new Keypair(secureAccount.keypair, netType)
  }, [currentAccount, getSecureAccount])

  const getApiToken = useCallback(
    async (address?: string) => {
      if (!address) {
        return ''
      }

      let secureAccount = secureAccounts?.[address]
      if (!secureAccount) {
        secureAccount = await getSecureAccount(address)
      }
      return secureAccount?.apiToken || ''
    },
    [getSecureAccount, secureAccounts],
  )

  useAsync(async () => {
    const restoredContacts = await getFromCloudStorage<CSAccount[]>(
      CloudStorageKeys.CONTACTS,
    )
    // TODO: This can be removed eventually, it's needed for backwards compatability
    restoredContacts?.forEach((acct) => {
      // eslint-disable-next-line no-param-reassign
      acct.netType = accountNetType(acct.address)
    })

    setContacts(restoredContacts || [])

    const cloudAccounts = await getAccounts()

    // TODO: This can be removed eventually, it's needed for backwards compatability
    Object.keys(cloudAccounts).forEach((key) => {
      const acct = cloudAccounts[key]
      acct.netType = accountNetType(acct.address)
    })

    setAccounts(cloudAccounts)
    if (Object.keys(cloudAccounts).length) {
      const [first] = sortAccounts(cloudAccounts)
      setCurrentAccount(first)
    }

    const csViewType = (await CloudStorage.getItem(
      CloudStorageKeys.VIEW_TYPE,
    )) as AccountView
    setViewType(csViewType || 'unified')

    const promises = Object.keys(cloudAccounts).map((k) => getSecureAccount(k))
    const secureAccountsArr = await Promise.all(promises)
    const nextSecureAccounts = secureAccountsArr.reduce((obj, val) => {
      if (!val) return obj
      return { ...obj, [val.address]: val }
    }, {})

    setSecureAccounts(nextSecureAccounts)
  }, [])

  const upsertAccount = useCallback(
    async (account: Omit<CSAccount & SecureAccount, 'netType'>) => {
      const { address, mnemonic, keypair, alias, apiToken } = account
      const secureAccount = { mnemonic, keypair, address, apiToken }

      const nextAccount: CSAccount = {
        alias,
        address: account.address,
        netType: accountNetType(account.address),
      }

      const nextAccounts: CSAccounts = {
        ...accounts,
        [account.address]: nextAccount,
      }
      setAccounts(nextAccounts)
      setCurrentAccount(nextAccount)
      setSecureAccounts({
        ...secureAccounts,
        [address]: secureAccount,
      })
      await CloudStorage.setItem(
        CloudStorageKeys.ACCOUNTS,
        JSON.stringify(nextAccounts),
      )
      return SecureStore.setItemAsync(address, JSON.stringify(secureAccount))
    },
    [accounts, secureAccounts],
  )

  const addContact = useCallback(
    async (account: CSAccount) => {
      const filtered = contacts.filter((c) => c.address !== account.address)
      const nextContacts = [...filtered, account]
      setContacts(nextContacts)
      return CloudStorage.setItem(
        CloudStorageKeys.CONTACTS,
        JSON.stringify(nextContacts),
      )
    },
    [contacts],
  )

  const updateViewType = useCallback(async (nextViewType: AccountView) => {
    setViewType(nextViewType)
    return CloudStorage.setItem(CloudStorageKeys.VIEW_TYPE, nextViewType)
  }, [])

  const createSecureAccount = useCallback(
    async (
      givenMnemonic: Mnemonic | Array<string> | null = null,
      netType?: number,
      use24Words?: boolean,
    ): Promise<SecureAccount> => {
      let mnemonic: Mnemonic
      if (!givenMnemonic) {
        mnemonic = await Mnemonic.create(use24Words ? 24 : 12)
      } else if ('words' in givenMnemonic) {
        mnemonic = givenMnemonic
      } else {
        mnemonic = new Mnemonic(givenMnemonic)
      }
      const { keypair, address } = await Keypair.fromMnemonic(mnemonic, netType)

      const apiToken = await makeWalletApiToken(
        address.b58,
        new Keypair(keypair),
      )
      const secureAccount = {
        mnemonic: mnemonic.words,
        keypair,
        apiToken,
      }

      return { address: address.b58, ...secureAccount }
    },
    [],
  )

  const signOut = useCallback(
    async (address?: string) => {
      if (address) {
        // sign out of specific account
        await SecureStore.deleteItemAsync(address)
        let newAccounts: CSAccounts = {}
        let newSecureAccounts: SecureAccounts = {}
        if (accounts && accounts[address]) {
          newAccounts = { ...accounts }
          delete newAccounts[address]
        }
        if (secureAccounts && secureAccounts[address]) {
          newSecureAccounts = { ...secureAccounts }
          delete newSecureAccounts[address]
        }
        await CloudStorage.setItem(
          CloudStorageKeys.ACCOUNTS,
          JSON.stringify(newAccounts),
        )
        setAccounts(newAccounts)
        setSecureAccounts(newSecureAccounts)
        setCurrentAccount(accounts ? accounts[0] : undefined)
      } else {
        // sign out of all accounts
        await Promise.all([
          ...Object.keys(secureAccounts || {}).map((key) =>
            SecureStore.deleteItemAsync(key),
          ),
          SecureStore.deleteItemAsync(SecureStorageKeys.PIN),
          SecureStore.deleteItemAsync(SecureStorageKeys.LAST_IDLE),
          CloudStorage.multiRemove(Object.values(CloudStorageKeys)),
        ])
        setAccounts({})
        setSecureAccounts({})
        setContacts([])
        setViewType('unified')
      }
    },
    [accounts, secureAccounts],
  )

  return {
    accounts,
    accountAddresses,
    addContact,
    contacts,
    contactsForNetType,
    createSecureAccount,
    currentAccount,
    currentApiToken,
    currentContact,
    getApiToken,
    getKeypair,
    getSecureAccount,
    hasAccounts,
    mainnetContacts,
    restored,
    secureAccounts,
    setCurrentAccount,
    setCurrentContact,
    signOut,
    sortedAccounts,
    sortedAccountsForNetType,
    sortedMainnetAccounts,
    sortedTestnetAccounts,
    testnetContacts,
    updateViewType,
    upsertAccount,
    viewType,
  }
}

const initialState = {
  accounts: {},
  accountAddresses: [],
  addContact: async () => undefined,
  contacts: [],
  contactsForNetType: () => [],
  createSecureAccount: async () => ({
    mnemonic: [],
    keypair: { pk: '', sk: '' },
    address: '',
  }),
  currentAccount: undefined,
  currentApiToken: undefined,
  currentContact: undefined,
  getApiToken: (_address?: string) =>
    new Promise<string>((resolve) => resolve('')),
  getKeypair: () =>
    new Promise<Keypair | undefined>((resolve) => resolve(undefined)),
  getSecureAccount: () =>
    new Promise<SecureAccount | undefined>((resolve) => resolve(undefined)),
  hasAccounts: false,
  mainnetContacts: [],
  restored: false,
  secureAccounts: {},
  setCurrentAccount: () => undefined,
  setCurrentContact: () => undefined,
  signOut: async () => undefined,
  sortedAccounts: [],
  sortedAccountsForNetType: () => [],
  sortedMainnetAccounts: [],
  sortedTestnetAccounts: [],
  testnetContacts: [],
  updateViewType: async () => undefined,
  upsertAccount: async () => undefined,
  viewType: 'unified' as AccountView,
}

const AccountStorageContext =
  createContext<ReturnType<typeof useAccountStorageHook>>(initialState)
const { Provider } = AccountStorageContext

const AccountStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAccountStorageHook()}>{children}</Provider>
}

export const useAccountStorage = () => useContext(AccountStorageContext)

export default AccountStorageProvider
