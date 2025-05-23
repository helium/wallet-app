import { NetTypes as NetType } from '@helium/address'
import { useAppState } from '@react-native-community/hooks'
import { createHash } from 'crypto'
import * as SecureStore from 'expo-secure-store'
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
import Config from 'react-native-config'
import { authSlice } from '../store/slices/authSlice'
import { useAppDispatch } from '../store/store'
import {
  accountNetType,
  AccountNetTypeOpt,
  heliumAddressToSolAddress,
} from '../utils/accountUtils'
import makeApiToken from '../utils/makeApiToken'
import {
  CSAccount,
  CSAccounts,
  getCloudDefaultAccountAddress,
  restoreAccounts,
  setCloudDefaultAccountAddress,
  signoutCloudStorage,
  sortAccounts,
  updateCloudAccounts,
  updateCloudContacts,
} from './cloudStorage'
import { removeAccountTag, tagAccount } from './oneSignalStorage'
import {
  deleteSecureAccount,
  SecureAccount,
  signoutSecureStore,
  storeSecureAccount,
  storeSecureItem,
} from './secureStorage'

const { VIEW_AS } = Config

export const MAX_ACCOUNTS = 50

const useAccountStorageHook = () => {
  const [currentAccount, setCurrentAccount] = useState<
    CSAccount | null | undefined
  >(undefined)
  const [accounts, setAccounts] = useState<CSAccounts>()
  const [contacts, setContacts] = useState<CSAccount[]>([])
  const [defaultAccountAddress, setDefaultAccountAddress] = useState<string>()

  const solanaAccountsUpdateComplete = useRef(false)
  const solanaContactsUpdateComplete = useRef(false)
  const dispatch = useAppDispatch()
  const currentAppState = useAppState()

  const updateApiToken = useCallback(async () => {
    const apiToken = await makeApiToken(currentAccount?.address)
    storeSecureItem('walletApiToken', apiToken)
    dispatch(authSlice.actions.setApiToken(apiToken))
  }, [currentAccount, dispatch])

  useEffect(() => {
    if (currentAppState === 'active') {
      updateApiToken()
    }
  }, [currentAccount, currentAppState, updateApiToken])

  const currentNetworkAddress = useMemo(() => {
    return currentAccount?.solanaAddress
  }, [currentAccount])

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
    () => accountAddresses?.length >= MAX_ACCOUNTS,
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
    const accts = accounts || ({} as CSAccounts)
    if (solanaAccountsUpdateComplete.current || !Object.keys(accts).length)
      return

    solanaAccountsUpdateComplete.current = true

    const updated = Object.keys(accts).reduce((result, addy) => {
      const acct = accts[addy]
      if (!acct) return result
      return {
        ...result,
        [addy]: {
          ...acct,
          solanaAddress: VIEW_AS || heliumAddressToSolAddress(addy),
        },
      }
    }, {} as CSAccounts)

    setAccounts(updated)
    updateCloudAccounts(updated)
  }, [accounts])

  useEffect(() => {
    // Ensure all contacts have solana address
    if (!contacts.length || solanaContactsUpdateComplete.current) {
      return
    }

    solanaContactsUpdateComplete.current = true

    const updated = contacts.map((c) => {
      if (c.solanaAddress) return c
      return {
        ...c,
        solanaAddress: VIEW_AS || heliumAddressToSolAddress(c.address),
      }
    })

    setContacts(updated)
    updateCloudContacts(updated)
  }, [contacts])

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

  const mainnetContacts = useMemo(
    () => contacts.filter(({ netType }) => netType === NetType.MAINNET),
    [contacts],
  )

  const contactsForNetType = useCallback(() => {
    return mainnetContacts.filter((c) => !!c.solanaAddress)
  }, [mainnetContacts])

  const upsertAccount = useCallback(
    async ({
      secureAccount,
      ...csAccount
    }: Omit<CSAccount, 'netType'> & { secureAccount?: SecureAccount }) => {
      if (secureAccount) {
        await storeSecureAccount(secureAccount)
      }

      const mnemonicHash = secureAccount?.mnemonic
        ? createHash('sha256')
            .update(secureAccount.mnemonic.join(' '))
            .digest('hex')
        : csAccount.mnemonicHash

      const solanaAddress =
        csAccount.solanaAddress || heliumAddressToSolAddress(csAccount.address)

      const nextAccount: CSAccount = {
        ...csAccount,
        mnemonicHash,
        version: 'v1',
        netType: accountNetType(csAccount.address),
        solanaAddress,
      }

      const nextAccounts: CSAccounts = {
        ...accounts,
        [csAccount.address]: nextAccount,
      }

      setAccounts(nextAccounts)
      setCurrentAccount(nextAccount)

      await Promise.all([
        updateCloudAccounts(nextAccounts),
        tagAccount(csAccount.address),
      ])
    },
    [accounts],
  )

  const upsertAccounts = useCallback(
    async (
      accountBulk: Array<
        Partial<CSAccount> & {
          address: string
          solanaAddress: string
          ledgerIndex?: number
        }
      >,
    ) => {
      if (!accountBulk.length) return

      const bulkAccounts = accountBulk.reduce<CSAccounts>((acc, curr) => {
        const { address, ledgerIndex, ...rest } = curr
        acc[address] = {
          ...rest,
          address,
          netType: accountNetType(address),
          accountIndex: ledgerIndex ?? 0,
          keystoneDevice: curr.keystoneDevice,
        } as CSAccount
        return acc
      }, {})

      const nextAccounts: CSAccounts = { ...accounts, ...bulkAccounts }

      setAccounts(nextAccounts)
      setCurrentAccount(
        nextAccounts[accountBulk[accountBulk.length - 1].address],
      )
      await updateCloudAccounts(nextAccounts)

      await Promise.all(Object.keys(bulkAccounts).map(tagAccount))
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
        (c) =>
          c.address !== oldAddress &&
          c.solanaAddress !== heliumAddressToSolAddress(oldAddress),
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
