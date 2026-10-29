import type { CSAccount, CSAccounts, CSToken } from '../cloudStorage'

const mockPlatform = { OS: 'ios' }
const mockICloud = new Map<string, string>()

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

const address = '13BnsQ6hHjfvJXYxwpWeMaD5Ep5nN1b4BPRJy4AqBkDq3mTF8Sk'
const legacyTokens: CSToken = {
  [address]: ['hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'],
}

// Fresh modules per test, so each test starts with empty storage and stores
/* eslint-disable global-require, @typescript-eslint/no-var-requires */
const load = () => ({
  ...(require('../cloudStorage') as typeof import('../cloudStorage')),
  ...(require('../importLegacyState') as typeof import('../importLegacyState')),
  ...(require('../../store/cloudStore') as typeof import('../../store/cloudStore')),
})
/* eslint-enable global-require, @typescript-eslint/no-var-requires */

beforeEach(() => {
  jest.resetModules()
  mockICloud.clear()
  mockPlatform.OS = 'ios'
  mockICloud.set(`${ICLOUD_PREFIX}visibleTokens`, JSON.stringify(legacyTokens))
})

describe('cloudStorage', () => {
  it('waits for the legacy import before reading', async () => {
    const m = load()

    expect(await m.restoreVisibleTokens()).toEqual(legacyTokens)
  })

  it('returns a copy, so callers cannot change the store', async () => {
    const m = load()
    await m.importLegacyState()

    const tokens = await m.restoreVisibleTokens()
    tokens?.[address].push('x')

    expect(m.useCloudStore.getState().visibleTokens).toEqual(legacyTokens)
  })

  it('writes after the import, so the import does not overwrite them', async () => {
    const m = load()
    const newTokens: CSToken = { [address]: ['new-mint'] }

    await m.updateVisibleTokens(newTokens)

    expect(await m.restoreVisibleTokens()).toEqual(newTokens)
  })
})

const wallet = (alias: string, solanaAddress: string): CSAccount => ({
  alias,
  address: `helium-${alias}`,
  solanaAddress,
  netType: 0,
  version: 'v1',
})
const walletA = wallet('A', 'sol-a')
const walletB = wallet('B', 'sol-b')
const walletC = wallet('C', 'sol-c')
const friend = wallet('Friend', 'sol-friend')

// What a main build left in iCloud: wallets A and B, A as default, no contacts
const seedMainICloud = () => {
  mockICloud.set(
    `${ICLOUD_PREFIX}accounts`,
    JSON.stringify({ [walletA.address]: walletA, [walletB.address]: walletB }),
  )
  mockICloud.set(`${ICLOUD_PREFIX}defaultAccountAddress`, walletA.address)
  mockICloud.set(`${ICLOUD_PREFIX}contacts`, '[]')
}

describe('iCloud restore after the upgrade', () => {
  it('restores the current wallets and contacts on a reinstall', async () => {
    seedMainICloud()
    const upgraded = load()
    await upgraded.restoreAccounts()

    // Add C, sign out of the default A, make C the default, add a contact
    const current: CSAccounts = {
      [walletB.address]: walletB,
      [walletC.address]: walletC,
    }
    await upgraded.updateCloudAccounts({
      [walletA.address]: walletA,
      [walletB.address]: walletB,
      [walletC.address]: walletC,
    })
    await upgraded.updateCloudAccounts(current)
    await upgraded.setCloudDefaultAccountAddress(walletC.address)
    await upgraded.updateCloudContacts([friend])
    await upgraded.updateLastViewedNotifications(1700000001)

    // iCloud holds the strings a main build writes and reads
    const mainAccounts =
      '{"helium-B":{"alias":"B","address":"helium-B","solanaAddress":"sol-b","netType":0,"version":"v1"},' +
      '"helium-C":{"alias":"C","address":"helium-C","solanaAddress":"sol-c","netType":0,"version":"v1"}}'
    const mainContacts =
      '[{"alias":"Friend","address":"helium-Friend","solanaAddress":"sol-friend","netType":0,"version":"v1"}]'
    expect(mockICloud.get(`${ICLOUD_PREFIX}accounts`)).toBe(mainAccounts)
    expect(mockICloud.get(`${ICLOUD_PREFIX}defaultAccountAddress`)).toBe(
      'helium-C',
    )
    expect(mockICloud.get(`${ICLOUD_PREFIX}contacts`)).toBe(mainContacts)
    expect(mockICloud.get(`${ICLOUD_PREFIX}lastViewedNotifications`)).toBe(
      '1700000001',
    )

    // Reinstall: fresh modules and MMKV; iCloud is kept
    jest.resetModules()
    const reinstalled = load()
    const restored = await reinstalled.restoreAccounts()

    expect(restored.csAccounts).toEqual(current)
    expect(restored.current).toEqual(walletC)
    expect(restored.contacts).toEqual([friend])
    expect(await reinstalled.getLastViewedNotifications()).toBe(1700000001)
  })

  it('removes the iCloud default when the default is cleared', async () => {
    seedMainICloud()
    const upgraded = load()
    await upgraded.updateCloudAccounts({})
    await upgraded.setCloudDefaultAccountAddress(undefined)

    expect(mockICloud.has(`${ICLOUD_PREFIX}defaultAccountAddress`)).toBe(false)

    jest.resetModules()
    const restored = await load().restoreAccounts()

    expect(restored.csAccounts).toEqual({})
    expect(restored.current).toBeNull()
  })

  it('does not write iCloud on Android', async () => {
    mockPlatform.OS = 'android'
    const before = [...mockICloud.entries()]
    const m = load()

    await m.updateCloudAccounts({ [walletC.address]: walletC })
    await m.setCloudDefaultAccountAddress(undefined)

    expect([...mockICloud.entries()]).toEqual(before)
  })
})
