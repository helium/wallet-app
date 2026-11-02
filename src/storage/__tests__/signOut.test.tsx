import Address, { KeyTypes, NetTypes } from '@helium/address'
import { Keypair } from '@solana/web3.js'
import { Alert } from 'react-native'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AccountStorageProvider, {
  useAccountStorage,
} from '../AccountStorageProvider'
import type { CSAccount, CSAccounts } from '../cloudStorage'
import { removeAccountTag } from '../oneSignalStorage'
import { resetAppState } from '../resetAppState'
import { storeSecureAccount, storeSecureItem } from '../secureStorage'

declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true
// A release build: accountSolanaAddress reads it
Object.assign(global, { __DEV__: false })

// The device keychain. A key in mockFailingKeys makes its delete reject, as
// expo-secure-store does on iOS for a keychain error other than not-found.
const mockKeychain = new Map<string, string>()
const mockFailingKeys = new Set<string>()
// The iCloud list of accounts
const mockCloud: { accounts: CSAccounts; defaultAddress?: string } = {
  accounts: {},
}

jest.mock('expo-secure-store', () => ({
  setItemAsync: async (key: string, value: string) => {
    mockKeychain.set(key, value)
  },
  getItemAsync: async (key: string) => mockKeychain.get(key) ?? null,
  deleteItemAsync: async (key: string) => {
    if (mockFailingKeys.has(key)) throw new Error(`Keychain error on ${key}`)
    mockKeychain.delete(key)
  },
}))
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'ios' },
}))
// Not active: the API token refresh stays out of the sign-out
jest.mock('@react-native-community/hooks', () => ({
  useAppState: () => 'background',
}))
jest.mock('../../utils/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}))
jest.mock('../../utils/config', () => ({ __esModule: true, default: {} }))
jest.mock('../../utils/makeApiToken', () => ({
  __esModule: true,
  default: async () => '',
}))
jest.mock('../../store/authStore', () => ({
  useAuthStore: { setState: () => {} },
}))
jest.mock('../../navigation/NavigationHelper', () => ({}))
jest.mock('@hooks/useDerivationAccounts', () => ({}), { virtual: true })
jest.mock('@helium/crypto-react-native', () => ({}))
jest.mock('@helium/spl-utils', () => ({}))
// Native module that accountUtils imports; the address conversion never uses it
jest.mock('bcrypt-react-native', () => ({}))
jest.mock('../cloudStorage', () => ({
  restoreAccounts: async () => ({
    csAccounts: { ...mockCloud.accounts },
    current: Object.values(mockCloud.accounts)[0] ?? null,
    contacts: [],
  }),
  sortAccounts: (accounts: CSAccounts) => Object.values(accounts),
  updateCloudAccounts: async (accounts: CSAccounts) => {
    mockCloud.accounts = accounts
  },
  updateCloudContacts: async () => {},
  getCloudDefaultAccountAddress: async () => mockCloud.defaultAddress,
  setCloudDefaultAccountAddress: async (address?: string) => {
    mockCloud.defaultAddress = address
  },
}))
jest.mock('../importLegacyState', () => ({
  subscribeCloudItemChanges: () => () => {},
}))
jest.mock('../oneSignalStorage', () => ({
  removeAccountTag: jest.fn(async () => {}),
  tagAccount: async () => {},
}))
jest.mock('../resetAppState', () => ({
  resetAppState: jest.fn(async () => {}),
}))

const makeAccount = (alias: string): CSAccount => {
  const keypair = Keypair.generate()
  return {
    alias,
    address: new Address(
      0,
      NetTypes.MAINNET,
      KeyTypes.ED25519_KEY_TYPE,
      keypair.publicKey.toBytes(),
    ).b58,
    solanaAddress: keypair.publicKey.toBase58(),
    netType: NetTypes.MAINNET,
    version: 'v1',
  }
}

const storeKey = (account: CSAccount) =>
  storeSecureAccount({
    address: account.address,
    keypair: { pk: 'pk', sk: 'sk' },
  })

let latest: ReturnType<typeof useAccountStorage> | undefined
const Probe = () => {
  const result = useAccountStorage()
  React.useEffect(() => {
    latest = result
  })
  return null
}
const storage = () => {
  if (!latest) throw new Error('not rendered')
  return latest
}

// async act flushes the restore of the account list
const render = async () => {
  await act(async () => {
    TestRenderer.create(
      <AccountStorageProvider>
        <Probe />
      </AccountStorageProvider>,
    )
  })
}

const main = makeAccount('Main')
const other = makeAccount('Other')

beforeEach(async () => {
  mockKeychain.clear()
  mockFailingKeys.clear()
  mockCloud.accounts = { [main.address]: main, [other.address]: other }
  mockCloud.defaultAddress = main.address
  ;(Alert.alert as jest.Mock).mockClear()
  ;(resetAppState as jest.Mock).mockClear()
  ;(removeAccountTag as jest.Mock).mockClear()
  await storeKey(main)
  await storeKey(other)
  await storeSecureItem('pin', '1234')
  await storeSecureItem('lastIdle', '1')
  await storeSecureItem('hidePrivateKeyAlert', 'true')
  await storeSecureItem('walletApiToken', 'token')
  await render()
})

describe('signOut of one wallet', () => {
  it('keeps the wallet listed and shows an error when the keychain cannot delete its key', async () => {
    mockFailingKeys.add(main.address)

    await act(() => storage().signOut(main))

    expect(Object.keys(storage().accounts || {}).sort()).toEqual(
      [main.address, other.address].sort(),
    )
    expect(Object.keys(mockCloud.accounts).sort()).toEqual(
      [main.address, other.address].sort(),
    )
    expect(storage().currentAccount?.address).toBe(main.address)
    expect(mockKeychain.has(main.address)).toBe(true)
    expect(Alert.alert).toHaveBeenCalledWith(
      'generic.error',
      'settings.sections.account.signOutAlert.deleteFailed',
    )
    expect(removeAccountTag).not.toHaveBeenCalled()
  })

  it('removes the wallet tag once the keychain deletes its key', async () => {
    await act(() => storage().signOut(main))

    expect(mockKeychain.has(main.address)).toBe(false)
    expect(removeAccountTag).toHaveBeenCalledWith(main.address)
  })
})

describe('signOut of every wallet', () => {
  it('deletes every secret, the API token among them', async () => {
    await act(() => storage().signOut())

    expect([...mockKeychain.keys()]).toEqual([])
    expect(storage().accounts).toEqual({})
    expect(resetAppState).toHaveBeenCalled()
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('clears the other secrets and the list, and shows an error, when the keychain cannot delete one key', async () => {
    mockFailingKeys.add(main.address)

    await act(() => storage().signOut())

    expect([...mockKeychain.keys()]).toEqual([main.address])
    expect(storage().accounts).toEqual({})
    expect(storage().currentAccount).toBeUndefined()
    expect(resetAppState).toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith(
      'generic.error',
      'settings.sections.account.signOutAlert.deleteFailedAll',
    )
  })

  it('clears the list without an error alert when only the PIN delete fails', async () => {
    mockFailingKeys.add('pin')
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    await act(() => storage().signOut())

    expect(storage().accounts).toEqual({})
    expect(resetAppState).toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalled()
    expect(Alert.alert).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
