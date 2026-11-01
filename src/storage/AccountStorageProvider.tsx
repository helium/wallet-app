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
import { Alert } from 'react-native'
import { useAuthStore } from '../store/authStore'
import {
  accountNetType,
  AccountNetTypeOpt,
  heliumAddressToSolAddress,
} from '../utils/accountUtils'
import i18n from '../utils/i18n'
import makeApiToken from '../utils/makeApiToken'
import {
  CSAccount,
  CSAccounts,
  getCloudDefaultAccountAddress,
  restoreAccounts,
  setCloudDefaultAccountAddress,
  sortAccounts,
  updateCloudAccounts,
  updateCloudContacts,
} from './cloudStorage'
import {
  accountSolanaAddress,
  contactSolanaAddress,
} from './accountSolanaAddress'
import { subscribeCloudItemChanges } from './importLegacyState'
import { removeAccountTag, tagAccount } from './oneSignalStorage'
import { resetAppState } from './resetAppState'
import {
  deleteSecureAccount,
  SecureAccount,
  signoutSecureStore,
  storeSecureAccount,
  storeSecureItem,
} from './secureStorage'

export const MAX_ACCOUNTS = 50

const hashMnemonic = (mnemonic: string[]) =>
  createHash('sha256').update(mnemonic.join(' ')).digest('hex')

const useAccountStorageHook = () => {
  const [currentAccount, setCurrentAccount] = useState<
    CSAccount | null | undefined
  >(undefined)
  const [accounts, setAccounts] = useState<CSAccounts>()
  const [contacts, setContacts] = useState<CSAccount[]>([])
  const [defaultAccountAddress, setDefaultAccountAddress] = useState<string>()
  // Bumped on every private key write, so readers that cache a key reload it
  const [secureAccountsVersion, setSecureAccountsVersion] = useState(0)

  const solanaAccountsUpdateComplete = useRef(false)
  const solanaContactsUpdateComplete = useRef(false)
  const currentAppState = useAppState()

  const updateApiToken = useCallback(async () => {
    const apiToken = await makeApiToken(currentAccount?.address)
    await storeSecureItem('walletApiToken', apiToken)
    useAuthStore.setState({ apiToken })
  }, [currentAccount])

  useEffect(() => {
    if (currentAppState === 'active') {
      void updateApiToken()
    }
  }, [currentAccount, currentAppState, updateApiToken])

  const currentNetworkAddress = useMemo(() => {
    return currentAccount?.solanaAddress
  }, [currentAccount])

  // Runs on mount and when another device on the Apple ID changes the shared
  // list, not when sign-out clears the query cache: the restore also migrates
  // and writes accounts. Only the latest run's result is applied.
  const [restoredAccounts, setRestoredAccounts] =
    useState<Awaited<ReturnType<typeof restoreAccounts>>>()
  const restoreRun = useRef(0)
  const reloadAccounts = useCallback(() => {
    restoreRun.current += 1
    const run = restoreRun.current
    restoreAccounts()
      .then((result) => {
        if (run === restoreRun.current) setRestoredAccounts(result)
      })
      .catch((e) => console.error(e))
  }, [])
  useEffect(reloadAccounts, [reloadAccounts])

  // Another device on the Apple ID changed the shared list
  useEffect(() => subscribeCloudItemChanges(reloadAccounts), [reloadAccounts])

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
          solanaAddress: accountSolanaAddress(addy),
        },
      }
    }, {} as CSAccounts)

    setAccounts(updated)
    // currentAccount was restored from storage, so it can hold an old address
    setCurrentAccount(
      (current) => (current && updated[current.address]) || current,
    )
    void updateCloudAccounts(updated)
  }, [accounts])

  useEffect(() => {
    // Derive every contact's solana address
    if (!contacts.length || solanaContactsUpdateComplete.current) {
      return
    }

    solanaContactsUpdateComplete.current = true

    const updated = contacts.map((c) => {
      const solanaAddress = contactSolanaAddress(c)
      return solanaAddress === c.solanaAddress ? c : { ...c, solanaAddress }
    })

    setContacts(updated)
    void updateCloudContacts(updated)
  }, [contacts])

  const [prevRestoredAccounts, setPrevRestoredAccounts] =
    useState<typeof restoredAccounts>()
  if (prevRestoredAccounts !== restoredAccounts) {
    setPrevRestoredAccounts(restoredAccounts)
    if (restoredAccounts) {
      setAccounts(restoredAccounts.csAccounts)
      // A reload keeps the open wallet while the list still holds it
      setCurrentAccount(
        (current) =>
          (current && restoredAccounts.csAccounts[current.address]) ||
          restoredAccounts.current,
      )
      setContacts(restoredAccounts.contacts)
    }
  }

  useEffect(() => {
    if (!accounts || Object.values(accounts)?.length === 0) return

    const restoreDefaultAccount = async () => {
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
    }
    restoreDefaultAccount().catch((e) => console.error(e))
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
        setSecureAccountsVersion((v) => v + 1)
      }

      const mnemonicHash = secureAccount?.mnemonic
        ? hashMnemonic(secureAccount.mnemonic)
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

      // State follows the write, so a failed write can be retried as new
      await updateCloudAccounts(nextAccounts)
      setAccounts(nextAccounts)
      setCurrentAccount(nextAccount)

      await tagAccount(csAccount.address)
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

      await updateCloudAccounts(nextAccounts)
      setAccounts(nextAccounts)
      setCurrentAccount(
        nextAccounts[accountBulk[accountBulk.length - 1].address],
      )

      await Promise.all(Object.keys(bulkAccounts).map(tagAccount))
    },
    [accounts],
  )

  // Stores the restored private keys and keeps each account record, adding the
  // derivation path the key was found at. The first account becomes current.
  const restoreSecureAccounts = useCallback(
    async (
      accountKeys: Array<{ account: CSAccount; secureAccount: SecureAccount }>,
    ) => {
      if (!accountKeys.length) return

      await Promise.all(
        accountKeys.map(({ secureAccount }) =>
          storeSecureAccount(secureAccount),
        ),
      )
      setSecureAccountsVersion((v) => v + 1)

      const nextAccounts: CSAccounts = { ...accounts }
      accountKeys.forEach(({ account, secureAccount }) => {
        nextAccounts[account.address] = {
          ...account,
          derivationPath: secureAccount.derivationPath,
          mnemonicHash: secureAccount.mnemonic
            ? hashMnemonic(secureAccount.mnemonic)
            : account.mnemonicHash,
        }
      })

      setAccounts(nextAccounts)
      setCurrentAccount(nextAccounts[accountKeys[0].account.address])
      await updateCloudAccounts(nextAccounts)
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
        try {
          await deleteSecureAccount(account)
        } catch (e) {
          // The key stays on this device, so the wallet stays listed for a retry
          console.error(e)
          Alert.alert(
            i18n.t('generic.error'),
            i18n.t('settings.sections.account.signOutAlert.deleteFailed'),
          )
          return
        }
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
        // sign out of all accounts. A failed keychain delete does not stop the
        // others, and the list still clears.
        const results = await Promise.allSettled([
          ...Object.keys(accounts || {}).map((key) => {
            return SecureStore.deleteItemAsync(key)
          }),
          ...Object.keys(accounts || {}).map((key) => {
            return removeAccountTag(key)
          }),
          ...signoutSecureStore(
            sortedAccounts.map(({ address: addr }) => addr),
          ),
          updateDefaultAccountAddress(undefined),
        ])
        // After the writes above, so none of them lands in the cleared state
        await resetAppState()
        setAccounts({})
        setContacts([])
        setCurrentAccount(undefined)
        const failures = results.filter((r) => r.status === 'rejected')
        if (failures.length) {
          console.error(failures.map((r) => r.reason))
          Alert.alert(
            i18n.t('generic.error'),
            i18n.t('settings.sections.account.signOutAlert.deleteFailedAll'),
          )
        }
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
    restoreSecureAccounts,
    secureAccountsVersion,
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
  restoreSecureAccounts: async () => undefined,
  secureAccountsVersion: 0,
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
