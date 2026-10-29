import type { CSAccount, CSAccounts } from '../cloudStorage'

const mockPlatform = { OS: 'ios' }
const mockICloud = new Map<string, string>()
const mockICloudListeners = new Set<() => void>()

jest.mock('react-native', () => ({ Platform: mockPlatform }))
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.requireActual(
    'react-native-mmkv/lib/createMMKV/createMockMMKV',
  ).createMockMMKV,
}))
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
}))
jest.mock('../../../modules/icloud-kvs', () => ({
  getICloudKVSString: (key: string) => mockICloud.get(key) ?? null,
  setICloudKVSString: (key: string, value: string) =>
    mockICloud.set(key, value),
  removeICloudKVSKeys: (keys: string[]) =>
    keys.forEach((key) => mockICloud.delete(key)),
  subscribeICloudKVSChanges: (listener: () => void) => {
    mockICloudListeners.add(listener)
    return () => mockICloudListeners.delete(listener)
  },
}))
// cloudStorage.ts imports these, but the tests do not use them
jest.mock('../secureStorage', () => ({ getSecureAccount: jest.fn() }))
// The @hooks alias is in babel.config.js, which Jest does not load
jest.mock(
  '@hooks/useDerivationAccounts',
  () => ({ HELIUM_DERIVATION: "m/44'/904'" }),
  { virtual: true },
)
jest.mock('@helium/spl-utils', () => ({
  heliumAddressToSolAddress: jest.fn(),
}))

// react-native-icloudstore put this prefix on every iCloud key
const ICLOUD_PREFIX = '@com.manicakes.iCloudStorage/'

/* eslint-disable global-require, @typescript-eslint/no-var-requires */
const load = () => ({
  ...(require('../cloudStorage') as typeof import('../cloudStorage')),
  ...(require('../importLegacyState') as typeof import('../importLegacyState')),
  ...(require('../mmkv') as typeof import('../mmkv')),
})
/* eslint-enable global-require, @typescript-eslint/no-var-requires */

const wallet = (alias: string): CSAccount => ({
  alias,
  address: `helium-${alias}`,
  solanaAddress: `sol-${alias}`,
  netType: 0,
  version: 'v1',
})
const W1 = wallet('W1')
const W2 = wallet('W2')
const W3 = wallet('W3')
const list = (...ws: CSAccount[]): CSAccounts =>
  Object.fromEntries(ws.map((w) => [w.address, w]))

// Each device has its own modules and MMKV; all share one iCloud KVS
const device = () => {
  jest.resetModules()
  return load()
}
// What AccountStorageProvider does on every launch: restore the list, then
// write it back with each wallet's solanaAddress
const launch = async (d: ReturnType<typeof load>) => {
  const { csAccounts } = await d.restoreAccounts()
  if (Object.keys(csAccounts).length) await d.updateCloudAccounts(csAccounts)
  return Object.keys(csAccounts)
}

beforeEach(() => {
  mockICloud.clear()
  mockICloudListeners.clear()
  mockPlatform.OS = 'ios'
})

describe('two iOS devices on one Apple ID share the iCloud wallet list', () => {
  beforeEach(() => {
    mockICloud.set(`${ICLOUD_PREFIX}accounts`, JSON.stringify(list(W1, W2)))
    mockICloud.set(`${ICLOUD_PREFIX}defaultAccountAddress`, W1.address)
  })

  it('a full sign-out on the phone signs the iPad out, and a reinstall restores nothing', async () => {
    const phone = device()
    await launch(phone)
    const ipad = device()
    await launch(ipad)

    // The phone's full sign-out: AccountStorageProvider.signOut -> resetAppState
    await phone.setCloudDefaultAccountAddress(undefined)
    await phone.removeLegacyCloudItems()

    expect(await launch(ipad)).toEqual([])
    const { csAccounts } = await device().restoreAccounts()
    expect(Object.keys(csAccounts)).toEqual([])
  })

  it('a wallet added on the phone stays after the iPad launches', async () => {
    const phone = device()
    await launch(phone)
    const ipad = device()
    await launch(ipad)

    await phone.updateCloudAccounts(list(W1, W2, W3))

    expect(await launch(ipad)).toEqual([W1.address, W2.address, W3.address])
    const { csAccounts } = await device().restoreAccounts()
    expect(csAccounts).toEqual(list(W1, W2, W3))
  })

  it('a wallet removed on the phone does not come back from the iPad', async () => {
    const phone = device()
    await launch(phone)
    const ipad = device()
    await launch(ipad)

    await phone.updateCloudAccounts(list(W1))

    expect(await launch(ipad)).toEqual([W1.address])
    const { csAccounts } = await device().restoreAccounts()
    expect(csAccounts).toEqual(list(W1))
  })

  it('tells a running iPad when the phone changes the list', async () => {
    const phone = device()
    await launch(phone)
    const ipad = device()
    await launch(ipad)
    const seen: string[][] = []
    ipad.subscribeCloudItemChanges(async () => {
      seen.push(Object.keys((await ipad.restoreAccounts()).csAccounts))
    })

    await phone.updateCloudAccounts(list(W1, W2, W3))
    // iOS posts the external change notification on the other devices
    await Promise.all([...mockICloudListeners].map((listener) => listener()))

    expect(seen).toEqual([[W1.address, W2.address, W3.address]])
  })
})

describe('a new install that reads iCloud before its first download', () => {
  it('shows the shared list once the download arrives', async () => {
    const ipad = device()

    expect(await launch(ipad)).toEqual([])
    expect(ipad.mmkv.getBoolean(ipad.LEGACY_IMPORT_DONE_KEY)).toBe(true)

    // The first download from iCloud lands
    mockICloud.set(`${ICLOUD_PREFIX}accounts`, JSON.stringify(list(W1, W2)))
    mockICloud.set(`${ICLOUD_PREFIX}defaultAccountAddress`, W2.address)

    const restored = await ipad.restoreAccounts()
    expect(restored.csAccounts).toEqual(list(W1, W2))
    expect(restored.current).toEqual(W2)
  })
})

describe('subscribeCloudItemChanges', () => {
  it('stops calling the listener after unsubscribe', () => {
    const m = device()
    const listener = jest.fn()

    const unsubscribe = m.subscribeCloudItemChanges(listener)
    unsubscribe()
    mockICloudListeners.forEach((l) => l())

    expect(listener).not.toHaveBeenCalled()
  })

  it('does not subscribe on Android, which has no shared list', () => {
    mockPlatform.OS = 'android'
    const m = device()

    m.subscribeCloudItemChanges(jest.fn())()

    expect(mockICloudListeners.size).toBe(0)
  })
})
