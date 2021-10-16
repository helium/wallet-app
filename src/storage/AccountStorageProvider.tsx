import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { Platform } from 'react-native'
import iCloudStorage from 'react-native-icloudstore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAsync } from 'react-async-hook'
import { Keypair, Mnemonic } from '@helium/crypto-react-native'
import * as SecureStore from 'expo-secure-store'

export type CSAccount = {
  alias: string
  address: string
  jazzIcon: number
}

export type CSAccounts = Record<string, CSAccount>

// for android we use AsyncStorage and auto backup to Google Drive using
// https://developer.android.com/guide/topics/data/autobackup
const CloudStorage = Platform.OS === 'ios' ? iCloudStorage : AsyncStorage

const CloudStorageKeys = {
  ACCOUNTS: 'accounts',
  VIEW_TYPE: 'viewType',
}

const SecureStorageKeys = {
  PIN: 'pin',
}

export type AccountView = 'unified' | 'split'

export type SecureAccount = {
  mnemonic: string[]
  keypair: { pk: string; sk: string }
  address: string
}
export type SecureAccounts = Record<string, SecureAccount>

const useAccountStorageHook = () => {
  const [accounts, setAccounts] = useState<CSAccounts>()
  const [secureAccounts, setSecureAccounts] = useState<SecureAccounts>()
  const [viewType, setViewType] = useState<AccountView>()
  const [pin, setPin] = useState<{
    value: string
    status: 'on' | 'restored' | 'off'
  }>()

  const restored = useMemo(() => secureAccounts !== undefined, [secureAccounts])

  useAsync(async () => {
    const cloudAccounts = await getAccounts()
    setAccounts(cloudAccounts)

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

    // TODO: When performing an account restore pin will not be restored.
    // Find a way to detect when a restore happens and prompt user for a new pin
    try {
      const nextPin = await SecureStore.getItemAsync(SecureStorageKeys.PIN)
      setPin({ value: nextPin || '', status: nextPin ? 'restored' : 'off' })
    } catch (e) {
      console.error(e)
      setPin({ value: '', status: 'off' })
    }
  }, [])

  const accountAddresses = useMemo(
    () => Object.keys(accounts || {}),
    [accounts],
  )

  const hasAccounts = useMemo(
    () => !!accountAddresses.length,
    [accountAddresses.length],
  )

  const sortedAccounts = useMemo(() => {
    // TODO: We'll probably want to find a way to order the accounts
    return accountAddresses.map((a) => (accounts || {})[a])
  }, [accountAddresses, accounts])

  const getAccounts = useCallback(async (): Promise<CSAccounts> => {
    const csAccounts = await CloudStorage.getItem(CloudStorageKeys.ACCOUNTS)
    if (!csAccounts) return {}

    return JSON.parse(csAccounts) as CSAccounts
  }, [])

  const getSecureAccount = useCallback(
    async (address: string): Promise<SecureAccount | undefined> => {
      let item: string | null = null
      try {
        item = await SecureStore.getItemAsync(address)
      } catch (e) {
        console.error(e)
      }

      if (!item) return
      return JSON.parse(item) as SecureAccount
    },
    [],
  )

  const upsertAccount = useCallback(
    async (account: CSAccount & SecureAccount) => {
      const { address, mnemonic, keypair, alias } = account
      const secureAccount = { mnemonic, keypair, address }
      const nextAccounts = {
        ...accounts,
        [account.address]: {
          alias,
          address: account.address,
          jazzIcon: account.jazzIcon,
        },
      }
      setAccounts(nextAccounts)
      setSecureAccounts({
        ...secureAccounts,
        [address]: secureAccount,
      })
      CloudStorage.setItem(
        CloudStorageKeys.ACCOUNTS,
        JSON.stringify(nextAccounts),
      )
      return SecureStore.setItemAsync(address, JSON.stringify(secureAccount))
    },
    [accounts, secureAccounts],
  )

  const updateViewType = useCallback(async (nextViewType: AccountView) => {
    setViewType(nextViewType)
    return CloudStorage.setItem(CloudStorageKeys.VIEW_TYPE, nextViewType)
  }, [])

  const updatePin = useCallback(async (nextPin: string) => {
    setPin({ value: nextPin, status: nextPin ? 'on' : 'off' })
    return SecureStore.setItemAsync(SecureStorageKeys.PIN, nextPin)
  }, [])

  const createSecureAccount = useCallback(
    async (
      givenMnemonic: Mnemonic | Array<string> | null = null,
    ): Promise<SecureAccount> => {
      let mnemonic: Mnemonic
      if (!givenMnemonic) {
        mnemonic = await Mnemonic.create()
      } else if ('words' in givenMnemonic) {
        mnemonic = givenMnemonic
      } else {
        mnemonic = new Mnemonic(givenMnemonic)
      }
      const { keypair, address } = await Keypair.fromMnemonic(mnemonic)

      const secureAccount = { mnemonic: mnemonic.words, keypair }

      return { address: address.b58, ...secureAccount }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await Promise.all([
      ...Object.keys(secureAccounts || {}).map((key) =>
        SecureStore.deleteItemAsync(key),
      ),
      SecureStore.deleteItemAsync(SecureStorageKeys.PIN),
      CloudStorage.multiRemove(Object.values(CloudStorageKeys)),
    ])

    setAccounts(undefined)
    setSecureAccounts(undefined)
    setPin(undefined)
    setViewType(undefined)
  }, [secureAccounts])

  return {
    viewType,
    accounts,
    sortedAccounts,
    hasAccounts,
    accountAddresses,
    secureAccounts,
    upsertAccount,
    updateViewType,
    signOut,
    createSecureAccount,
    pin,
    updatePin,
    restored,
  }
}

const initialState = {
  viewType: 'unified' as AccountView,
  accounts: {},
  hasAccounts: false,
  accountAddresses: [],
  sortedAccounts: [],
  secureAccounts: {},
  upsertAccount: async () => undefined,
  updateViewType: async () => undefined,
  signOut: async () => undefined,
  createSecureAccount: async () => ({
    mnemonic: [],
    keypair: { pk: '', sk: '' },
    address: '',
  }),
  pin: undefined,
  updatePin: async () => undefined,
  restored: false,
}

const AccountStorageContext =
  createContext<ReturnType<typeof useAccountStorageHook>>(initialState)
const { Provider } = AccountStorageContext

const AccountStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAccountStorageHook()}>{children}</Provider>
}

export const useAccountStorage = () => useContext(AccountStorageContext)

export default AccountStorageProvider
