import type { CSToken } from '../cloudStorage'

const mockICloud = new Map<string, string>()

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
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
