import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import * as SecureStore from 'expo-secure-store'
import { NetTypes as NetType, NetTypes } from '@helium/address'
import {
  accountNetType,
  AccountNetTypeOpt,
  heliumAddressToSolAddress,
} from '../utils/accountUtils'
import {
  createSecureAccount,
  deleteSecureAccount,
  SecureAccount,
  signoutSecureStore,
  storeSecureAccount,
} from './secureStorage'
import {
  CSAccount,
  CSAccounts,
  getCloudDefaultAccountAddress,
  LedgerDevice,
  restoreAccounts,
  setCloudDefaultAccountAddress,
  signoutCloudStorage,
  sortAccounts,
  updateCloudAccounts,
  updateCloudContacts,
} from './cloudStorage'
import { removeAccountTag, tagAccount } from './oneSignalStorage'
import { useAppStorage } from './AppStorageProvider'

const useAccountStorageHook = () => {
  const [currentAccount, setCurrentAccount] = useState<
    CSAccount | null | undefined
  >(undefined)
  const [accounts, setAccounts] = useState<CSAccounts>()
  const [contacts, setContacts] = useState<CSAccount[]>([])
  const [defaultAccountAddress, setDefaultAccountAddress] = useState<string>()
  const solanaAccountsUpdateComplete = useRef(false)
  const solanaContactsUpdateComplete = useRef(false)
  const { updateL1Network, l1Network } = useAppStorage()

  const currentNetworkAddress = useMemo(() => {
    if (l1Network === 'helium') return currentAccount?.address
    if (l1Network === 'solana') return currentAccount?.solanaAddress
  }, [currentAccount, l1Network])

  const { result: restoredAccounts } = useAsync(restoreAccounts, [])

  const restored = useMemo(() => accounts !== undefined, [accounts])

  const accountAddresses = useMemo(
    () => Object.keys(accounts || {}),
    [accounts],
  )

  const hasAccounts = useMemo(
    () => !!accountAddresses.length,
    [accountAddresses.length],
  )

  const reachedAccountLimit = useMemo(
    () => accountAddresses?.length >= 10,
    [accountAddresses.length],
  )

  const sortedAccounts = useMemo(
    () => sortAccounts(accounts || {}, defaultAccountAddress),
    [accounts, defaultAccountAddress],
  )

  const sortedTestnetAccounts = useMemo(
    () => sortedAccounts.filter(({ netType }) => netType === NetType.TESTNET),
    [sortedAccounts],
  )

  const sortedMainnetAccounts = useMemo(
    () => sortedAccounts.filter(({ netType }) => netType === NetType.MAINNET),
    [sortedAccounts],
  )

  useEffect(() => {
    // Ensure all accounts have solana address
    if (!sortedAccounts.length || solanaAccountsUpdateComplete.current) {
      return
    }

    solanaAccountsUpdateComplete.current = true

    sortedAccounts.filter((a) => !a.solanaAddress).forEach(upsertAccount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedAccounts])

  useEffect(() => {
    // Ensure all contacts have solana address
    if (!contacts.length || solanaContactsUpdateComplete.current) {
      return
    }

    solanaContactsUpdateComplete.current = true

    contacts
      .filter((a) => !a.solanaAddress)
      .forEach((c) => {
        editContact(c.address, c)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts])

  useEffect(() => {
    // if a testnet address is selected, set l1 back to helium
    if (currentAccount?.netType !== NetTypes.TESTNET) return
    updateL1Network('helium')
  }, [currentAccount, updateL1Network])

  useEffect(() => {
    if (!restoredAccounts) return

    setAccounts(restoredAccounts.csAccounts)
    setCurrentAccount(restoredAccounts.current)
    setContacts(restoredAccounts.contacts)
  }, [restoredAccounts])

  useAsync(async () => {
    if (!accounts || Object.values(accounts)?.length === 0) return

    const restoredAddress = await getCloudDefaultAccountAddress()
    if (!restoredAddress) {
      // set default account to first in list
      const firstAccount = Object.values(accounts)[0]
      const firstAddress = firstAccount.address
      await setCloudDefaultAccountAddress(firstAddress)
      setDefaultAccountAddress(firstAddress)
    } else {
      // restore default account
      setDefaultAccountAddress(restoredAddress)
    }
  }, [accounts])

  const sortedAccountsForNetType = useCallback(
    (netType: AccountNetTypeOpt) => {
      if (netType === NetType.MAINNET) {
        return sortedMainnetAccounts
      }
      if (netType === NetType.TESTNET) {
        return sortedTestnetAccounts
      }
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
      if (l1Network === 'solana') {
        return mainnetContacts.filter((c) => !!c.solanaAddress)
      }
      if (netType === NetType.MAINNET)
        return mainnetContacts.filter((c) => !!c.address)
      if (netType === NetType.TESTNET)
        return testnetContacts.filter((c) => !!c.address)
      return contacts.filter((c) => !!c.address)
    },
    [contacts, l1Network, mainnetContacts, testnetContacts],
  )

  const upsertAccount = useCallback(
    async ({
      secureAccount,
      ...csAccount
    }: Omit<CSAccount, 'netType'> & { secureAccount?: SecureAccount }) => {
      if (secureAccount) {
        await storeSecureAccount(secureAccount)
      }

      let { solanaAddress } = csAccount

      if (!solanaAddress) {
        solanaAddress = heliumAddressToSolAddress(csAccount.address)
      }

      const nextAccount: CSAccount = {
        ...csAccount,
        netType: accountNetType(csAccount.address),
        solanaAddress,
      }

      const nextAccounts: CSAccounts = {
        ...accounts,
        [csAccount.address]: nextAccount,
      }
      setAccounts(nextAccounts)
      setCurrentAccount(nextAccount)
      await updateCloudAccounts(nextAccounts)
      await tagAccount(csAccount.address)
    },
    [accounts],
  )

  const upsertAccounts = useCallback(
    async (
      accountBulk: {
        alias: string
        address: string
        ledgerDevice?: LedgerDevice
        ledgerIndex?: number
      }[],
    ) => {
      if (!accountBulk.length) return

      const bulkAccounts = accountBulk.reduce((prev, curr) => {
        const accountIndex = curr.ledgerIndex || 0
        return {
          ...prev,
          [curr.address]: {
            alias: curr.alias,
            address: curr.address,
            netType: accountNetType(curr.address),
            ledgerDevice: curr.ledgerDevice,
            accountIndex,
          },
        }
      }, {})

      const nextAccounts: CSAccounts = {
        ...accounts,
        ...bulkAccounts,
      }

      setAccounts(nextAccounts)
      setCurrentAccount(
        nextAccounts[accountBulk[accountBulk.length - 1].address],
      )
      await updateCloudAccounts(nextAccounts)

      // eslint-disable-next-line no-restricted-syntax
      for (const addr of Object.keys(bulkAccounts)) {
        // eslint-disable-next-line no-await-in-loop
        await tagAccount(addr)
      }
    },
    [accounts],
  )

  const addContact = useCallback(
    async (account: CSAccount) => {
      const nextAccount = account
      if (!nextAccount.solanaAddress && nextAccount.address) {
        nextAccount.solanaAddress = heliumAddressToSolAddress(
          nextAccount.address,
        )
      }
      const filtered = contacts.filter((c) => c.address !== nextAccount.address)
      const nextContacts = [...filtered, nextAccount]
      setContacts(nextContacts)

      return updateCloudContacts(nextContacts)
    },
    [contacts],
  )

  const editContact = useCallback(
    async (oldAddress: string, updatedAccount: CSAccount) => {
      const nextAccount = updatedAccount
      if (!nextAccount.solanaAddress && nextAccount.address) {
        nextAccount.solanaAddress = heliumAddressToSolAddress(
          nextAccount.address,
        )
      }
      const filtered = contacts.filter(
        (c) => c.address !== oldAddress && c.solanaAddress !== oldAddress,
      )
      const nextContacts = [...filtered, nextAccount]
      setContacts(nextContacts)

      return updateCloudContacts(nextContacts)
    },
    [contacts],
  )

  const deleteContact = useCallback(
    async (address: string) => {
      const filtered = contacts.filter(
        (c) => c.address !== address && c.solanaAddress !== address,
      )
      const nextContacts = [...filtered]
      setContacts(nextContacts)
      return updateCloudContacts(nextContacts)
    },
    [contacts],
  )

  const updateDefaultAccountAddress = useCallback(
    async (address: string | undefined) => {
      await setCloudDefaultAccountAddress(address)
      setDefaultAccountAddress(address)
    },
    [],
  )

  const signOut = useCallback(
    async (account?: CSAccount | null) => {
      if (account?.address) {
        // sign out of specific account
        await removeAccountTag(account.address)
        await deleteSecureAccount(account)
        let newAccounts: CSAccounts = {}
        if (accounts && accounts[account.address]) {
          newAccounts = { ...accounts }
          delete newAccounts[account.address]
        }
        const newAccountValues = Object.values(newAccounts)
        const newCurrentAccount = newAccountValues?.length
          ? newAccountValues[0]
          : undefined
        await updateCloudAccounts(newAccounts)
        setAccounts(newAccounts)
        setCurrentAccount(newCurrentAccount)
        if (account?.address === defaultAccountAddress) {
          await updateDefaultAccountAddress(newCurrentAccount?.address)
        }
      } else {
        // sign out of all accounts
        await Promise.all([
          ...Object.keys(accounts || {}).map((key) => {
            return SecureStore.deleteItemAsync(key)
          }),
          ...Object.keys(accounts || {}).map((key) => {
            return removeAccountTag(key)
          }),
          ...signoutSecureStore(
            sortedAccounts.map(({ address: addr }) => addr),
          ),
          signoutCloudStorage(),
          updateDefaultAccountAddress(undefined),
        ])
        setAccounts({})
        setContacts([])
        setCurrentAccount(undefined)
      }
    },
    [
      accounts,
      defaultAccountAddress,
      sortedAccounts,
      updateDefaultAccountAddress,
    ],
  )

  return {
    accountAddresses,
    accounts,
    addContact,
    contacts,
    contactsForNetType,
    createSecureAccount,
    currentAccount,
    currentNetworkAddress,
    defaultAccountAddress,
    deleteContact,
    editContact,
    hasAccounts,
    reachedAccountLimit,
    restored,
    setCurrentAccount,
    signOut,
    sortedAccounts,
    sortedAccountsForNetType,
    sortedMainnetAccounts,
    sortedTestnetAccounts,
    updateDefaultAccountAddress,
    upsertAccount,
    upsertAccounts,
  }
}

const initialState = {
  accounts: {},
  accountAddresses: [],
  addContact: async () => undefined,
  editContact: async () => undefined,
  deleteContact: async () => undefined,
  defaultAccountAddress: undefined,
  updateDefaultAccountAddress: async () => undefined,
  contacts: [],
  contactsForNetType: () => [],
  createSecureAccount: async () => ({
    mnemonic: [],
    keypair: { pk: '', sk: '' },
    address: '',
  }),
  currentAccount: undefined,
  currentNetworkAddress: '',
  hasAccounts: false,
  reachedAccountLimit: false,
  restored: false,
  setCurrentAccount: () => undefined,
  signOut: async () => undefined,
  sortedAccounts: [],
  sortedAccountsForNetType: () => [],
  sortedMainnetAccounts: [],
  sortedTestnetAccounts: [],
  upsertAccount: async () => undefined,
  upsertAccounts: async () => undefined,
}

const AccountStorageContext =
  createContext<ReturnType<typeof useAccountStorageHook>>(initialState)
const { Provider } = AccountStorageContext

const AccountStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAccountStorageHook()}>{children}</Provider>
}

export const useAccountStorage = () => useContext(AccountStorageContext)

export default AccountStorageProvider
