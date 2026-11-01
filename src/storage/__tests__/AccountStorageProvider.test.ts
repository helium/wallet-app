import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import AccountStorageProvider, {
  useAccountStorage,
} from '../AccountStorageProvider'
import { restoreAccounts, updateCloudAccounts } from '../cloudStorage'

// A real Helium/Solana address pair, so the restore keeps its solana address
const storedAccount = {
  alias: 'Stored',
  address: '14A9dTmrs8KPTGq8Sc4F9VEgDKKCCoBMYPXdxNPye9DTKEJvd6g',
  solanaAddress: 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
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
jest.mock('../importLegacyState', () => ({
  subscribeCloudItemChanges: () => () => {},
}))
jest.mock('../oneSignalStorage', () => ({
  removeAccountTag: () => Promise.resolve(),
  tagAccount: () => Promise.resolve(),
}))
jest.mock('../resetAppState', () => ({
  resetAppState: () => Promise.resolve(),
}))
jest.mock('../secureStorage', () => ({
  deleteSecureAccount: () => Promise.resolve(),
  signoutSecureStore: () => [],
  storeSecureAccount: () => Promise.resolve(),
  storeSecureItem: () => Promise.resolve(),
}))
jest.mock('expo-secure-store', () => ({}))
jest.mock('bcrypt-react-native', () => ({}))
jest.mock('@react-native-community/hooks', () => ({
  useAppState: () => 'background',
}))
jest.mock('../../store/authStore', () => ({ useAuthStore: {} }))
jest.mock('../../utils/makeApiToken', () => () => Promise.resolve(''))

const mockRestoreAccounts = restoreAccounts as jest.Mock
const mockUpdateCloudAccounts = updateCloudAccounts as jest.Mock

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

beforeAll(() => {
  ;(
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true
  // A release build, so accounts keep the solana address their key derives
  Object.assign(global, { __DEV__: false })
})

beforeEach(async () => {
  mockRestoreAccounts.mockReset()
  mockRestoreAccounts.mockResolvedValue({
    csAccounts: { [storedAccount.address]: storedAccount },
    current: storedAccount,
    contacts: [],
  })
  mockUpdateCloudAccounts.mockReset()
  mockUpdateCloudAccounts.mockResolvedValue(undefined)
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
