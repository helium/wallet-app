import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import AccountStorageProvider, {
  useAccountStorage,
} from '../AccountStorageProvider'
import * as SecureStore from 'expo-secure-store'
import { restoreAccounts, updateCloudAccounts } from '../cloudStorage'

// A real Helium/Solana address pair, so the restore keeps its solana address
const storedAccount = {
  alias: 'Stored',
  address: '14A9dTmrs8KPTGq8Sc4F9VEgDKKCCoBMYPXdxNPye9DTKEJvd6g',
  solanaAddress: 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
  netType: 0,
}
// A second stored wallet the user can open
const otherAccount = {
  alias: 'Other',
  address: '14ivpToFabfUhxpcwQawc49dbK3V63o1t5fGGDbbd1MqyLSppFh',
  solanaAddress: 'GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB',
  netType: 0,
}
const newAccount = {
  alias: 'New',
  address: '12zmaz84LWb5zTUkWSCRGMXRRPUypisLygqcUWQgkfES4xUPB7M',
  solanaAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
}

jest.mock('../cloudStorage', () => ({
  getCloudDefaultAccountAddress: () => Promise.resolve(undefined),
  restoreAccounts: jest.fn(),
  setCloudDefaultAccountAddress: () => Promise.resolve(),
  sortAccounts: (accounts: Record<string, object>) => Object.values(accounts),
  updateCloudAccounts: jest.fn(),
  updateCloudContacts: () => Promise.resolve(),
}))
// The provider's listener for changes another device makes to the shared list
let mockCloudListener: (() => void) | undefined
const mockUnsubscribeCloud = jest.fn()
jest.mock('../importLegacyState', () => ({
  subscribeCloudItemChanges: (listener: () => void) => {
    mockCloudListener = listener
    return mockUnsubscribeCloud
  },
}))
jest.mock('../oneSignalStorage', () => ({
  removeAccountTag: () => Promise.resolve(),
  tagAccount: () => Promise.resolve(),
}))
jest.mock('../resetAppState', () => ({
  resetAppState: () => Promise.resolve(),
}))
jest.mock('../secureStorage', () => ({
  // As the real one: delete the keychain item named by the address
  deleteSecureAccount: (account: { address: string }) =>
    jest.requireMock('expo-secure-store').deleteItemAsync(account.address),
  signoutSecureStore: () => [],
  storeSecureAccount: () => Promise.resolve(),
  storeSecureItem: () => Promise.resolve(),
}))
jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))
jest.mock('bcrypt-react-native', () => ({}))
jest.mock('@react-native-community/hooks', () => ({
  useAppState: () => 'background',
}))
jest.mock('../../store/authStore', () => ({ useAuthStore: {} }))
jest.mock('../../utils/makeApiToken', () => () => Promise.resolve(''))
// The provider shows sign-out errors with Alert and i18n
jest.mock('react-native', () => ({ Alert: { alert: () => {} } }))
jest.mock('../../utils/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}))

const mockRestoreAccounts = restoreAccounts as jest.Mock
const mockUpdateCloudAccounts = updateCloudAccounts as jest.Mock
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock

let storage: ReturnType<typeof useAccountStorage>
let renderer: ReactTestRenderer | undefined

const Capture = () => {
  // eslint-disable-next-line react-hooks/globals -- the test harness hands the hook result to the test
  storage = useAccountStorage()
  return null
}

const renderProvider = async () => {
  await act(async () => {
    renderer = create(
      React.createElement(
        AccountStorageProvider,
        null,
        React.createElement(Capture),
      ),
    )
  })
}

const writeFailed = new Error('write failed')

// Another device on the Apple ID changes the shared list
const changeCloudList = () => {
  if (!mockCloudListener) throw new Error('no cloud listener')
  mockCloudListener()
}

const restoreResult = (
  accounts: (typeof storedAccount)[],
  current: typeof storedAccount = storedAccount,
) => ({
  csAccounts: Object.fromEntries(accounts.map((a) => [a.address, a])),
  current,
  contacts: [],
})

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

beforeAll(() => {
  ;(
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true
  // A release build, so accounts keep the solana address their key derives
  Object.assign(global, { __DEV__: false })
})

beforeEach(async () => {
  mockCloudListener = undefined
  mockUnsubscribeCloud.mockReset()
  mockRestoreAccounts.mockReset()
  mockRestoreAccounts.mockResolvedValue({
    csAccounts: { [storedAccount.address]: storedAccount },
    current: storedAccount,
    contacts: [],
  })
  mockUpdateCloudAccounts.mockReset()
  mockUpdateCloudAccounts.mockResolvedValue(undefined)
  mockDeleteItemAsync.mockClear()
  await renderProvider()
  // Every later write is the one under test
  mockUpdateCloudAccounts.mockRejectedValue(writeFailed)
})

afterEach(() => {
  act(() => renderer?.unmount())
  renderer = undefined
})

describe('AccountStorageProvider', () => {
  it('adds the account and makes it current once upsertAccount writes it', async () => {
    mockUpdateCloudAccounts.mockResolvedValue(undefined)

    await act(async () => {
      await storage.upsertAccount(newAccount)
    })

    expect(mockUpdateCloudAccounts).toHaveBeenLastCalledWith(storage.accounts)
    expect(Object.keys(storage.accounts ?? {})).toEqual([
      storedAccount.address,
      newAccount.address,
    ])
    expect(storage.currentAccount?.address).toBe(newAccount.address)
  })

  it('keeps accounts and the current account when upsertAccount fails to write', async () => {
    const { accounts, currentAccount } = storage

    await act(async () => {
      await expect(storage.upsertAccount(newAccount)).rejects.toBe(writeFailed)
    })

    expect(Object.keys(storage.accounts ?? {})).toEqual([storedAccount.address])
    expect(storage.accounts).toBe(accounts)
    expect(storage.currentAccount).toBe(currentAccount)
  })

  it('deletes the stored key of a new account when upsertAccount fails to write', async () => {
    await act(async () => {
      await expect(
        storage.upsertAccount({
          ...newAccount,
          secureAccount: {
            address: newAccount.address,
            keypair: { pk: 'pk', sk: 'sk' },
          },
        }),
      ).rejects.toBe(writeFailed)
    })

    expect(mockDeleteItemAsync).toHaveBeenCalledWith(newAccount.address)
  })

  it('keeps the stored key of a listed account when upsertAccount fails to write', async () => {
    await act(async () => {
      await expect(
        storage.upsertAccount({
          ...storedAccount,
          secureAccount: {
            address: storedAccount.address,
            keypair: { pk: 'pk', sk: 'sk' },
          },
        }),
      ).rejects.toBe(writeFailed)
    })

    expect(mockDeleteItemAsync).not.toHaveBeenCalled()
  })

  it('keeps accounts and the current account when upsertAccounts fails to write', async () => {
    const { accounts, currentAccount } = storage

    await act(async () => {
      await expect(storage.upsertAccounts([newAccount])).rejects.toBe(
        writeFailed,
      )
    })

    expect(Object.keys(storage.accounts ?? {})).toEqual([storedAccount.address])
    expect(storage.accounts).toBe(accounts)
    expect(storage.currentAccount).toBe(currentAccount)
  })
})

describe('AccountStorageProvider reload from the shared list', () => {
  it('reloads the accounts when another device changes the shared list', async () => {
    mockRestoreAccounts.mockResolvedValueOnce(
      restoreResult([storedAccount, otherAccount]),
    )

    await act(async () => {
      changeCloudList()
    })

    expect(mockRestoreAccounts).toHaveBeenCalledTimes(2)
    expect(Object.keys(storage.accounts ?? {})).toEqual([
      storedAccount.address,
      otherAccount.address,
    ])
  })

  it('stops listening to the shared list on unmount', () => {
    act(() => renderer?.unmount())
    renderer = undefined

    expect(mockUnsubscribeCloud).toHaveBeenCalledTimes(1)
  })

  it('keeps the open wallet when the reloaded list still holds it', async () => {
    mockRestoreAccounts.mockResolvedValueOnce(
      restoreResult([storedAccount, otherAccount]),
    )
    await act(async () => {
      changeCloudList()
    })
    act(() =>
      storage.setCurrentAccount(storage.accounts?.[otherAccount.address]),
    )

    mockRestoreAccounts.mockResolvedValueOnce(
      restoreResult([storedAccount, otherAccount], storedAccount),
    )
    await act(async () => {
      changeCloudList()
    })

    expect(storage.currentAccount?.address).toBe(otherAccount.address)
  })

  it('opens the restored current wallet when the reloaded list drops the open one', async () => {
    mockRestoreAccounts.mockResolvedValueOnce(
      restoreResult([storedAccount, otherAccount]),
    )
    await act(async () => {
      changeCloudList()
    })
    act(() =>
      storage.setCurrentAccount(storage.accounts?.[otherAccount.address]),
    )

    mockRestoreAccounts.mockResolvedValueOnce(restoreResult([storedAccount]))
    await act(async () => {
      changeCloudList()
    })

    expect(storage.currentAccount?.address).toBe(storedAccount.address)
  })

  it('applies only the latest reload when an earlier one resolves after it', async () => {
    const earlier = deferred<ReturnType<typeof restoreResult>>()
    const latest = deferred<ReturnType<typeof restoreResult>>()
    mockRestoreAccounts
      .mockReturnValueOnce(earlier.promise)
      .mockReturnValueOnce(latest.promise)

    await act(async () => {
      changeCloudList()
      changeCloudList()
    })
    await act(async () => {
      latest.resolve(restoreResult([storedAccount, otherAccount]))
    })
    await act(async () => {
      earlier.resolve(restoreResult([storedAccount]))
    })

    expect(Object.keys(storage.accounts ?? {})).toEqual([
      storedAccount.address,
      otherAccount.address,
    ])
  })
})
