import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import Address from '@helium/address'
import { ED25519_KEY_TYPE } from '@helium/address/build/KeyTypes'
import { Keypair } from '@solana/web3.js'
import SelectKeystoneAccountsScreen from '../SelectKeystoneAccountsScreen'

type MockItem = { path: string }

// FlatList renders every account row.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  const FlatList = ({
    data,
    renderItem,
  }: {
    data: MockItem[]
    renderItem: (info: { item: MockItem; index: number }) => React.ReactNode
  }) =>
    ReactActual.createElement(
      'FlatList',
      null,
      data.map((item, index) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: item.path },
          renderItem({ item, index }),
        ),
      ),
    )
  return { View: 'View', RefreshControl: 'RefreshControl', FlatList }
})
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('@helium/spl-utils', () => ({ humanReadable: () => '0' }))
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Checkbox', () => ({ Checkbox: 'Checkbox' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('bcrypt-react-native', () => ({}))
jest.mock(
  '@utils/accountUtils',
  () => jest.requireActual('../../../utils/accountUtils'),
  { virtual: true },
)
jest.mock(
  '@utils/retryWithBackoff',
  () => ({ retryWithBackoff: (fn: () => Promise<unknown>) => fn() }),
  { virtual: true },
)
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: () => ({ connection: undefined }),
}))
jest.mock('../KeystoneOnboardingProvider', () => ({
  useKeystoneOnboarding: () => ({ setKeystoneOnboardingData: () => {} }),
}))

// Each test sets the stored accounts and the accounts the Keystone shows.
let mockAccounts: Record<string, object> = {}
let mockDerivationAccounts: object[] = []
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const accountStorage = {
      get accounts() {
        return mockAccounts
      },
      hasAccounts: true,
    }
    return { useAccountStorage: () => accountStorage, MAX_ACCOUNTS: 50 }
  },
  { virtual: true },
)
jest.mock('@react-navigation/native', () => {
  const navigation = { replace: () => {} }
  return {
    useNavigation: () => navigation,
    useRoute: () => ({
      params: {
        get derivationAccounts() {
          return mockDerivationAccounts
        },
      },
    }),
  }
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const keystoneKey = (seed: number) =>
  Keypair.fromSeed(new Uint8Array(32).fill(seed)).publicKey.toBytes()

const keystoneAccount = (seed: number) => ({
  path: `m/44'/501'/${seed}'`,
  publicKey: Buffer.from(keystoneKey(seed)).toString('hex'),
  masterFingerprint: 'fingerprint',
  device: 'Keystone 3 Pro',
})

// The Helium address KeystoneAccountAssignScreen stores the account under
const storedAddress = (seed: number) =>
  new Address(0, 0, ED25519_KEY_TYPE, keystoneKey(seed)).b58

const storeAccounts = (addresses: string[]) => {
  mockAccounts = {}
  addresses.forEach((address) => {
    mockAccounts[address] = {}
  })
}

const others = (count: number) =>
  Array.from({ length: count }, (_, i) => `other${i}`)

const seeds = (count: number) => Array.from({ length: count }, (_, i) => i + 1)

const renderScreen = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<SelectKeystoneAccountsScreen />)
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

const nextDisabled = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findByType('Button' as never).props.disabled

const showsAccountLimit = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType('Text' as never)
    .some((n) => n.props.children === 'accountImport.accountLimitLedger')

describe('SelectKeystoneAccountsScreen', () => {
  it('blocks Next and shows the account limit when the selection goes over it', async () => {
    storeAccounts(others(48))
    mockDerivationAccounts = seeds(5).map(keystoneAccount)
    const renderer = await renderScreen()

    expect(showsAccountLimit(renderer)).toBe(true)
    expect(nextDisabled(renderer)).toBe(true)
  })

  it('allows a selection that reaches the limit exactly', async () => {
    storeAccounts(others(45))
    mockDerivationAccounts = seeds(5).map(keystoneAccount)
    const renderer = await renderScreen()

    expect(showsAccountLimit(renderer)).toBe(false)
    expect(nextDisabled(renderer)).toBe(false)
  })

  it('does not count already-stored Keystone accounts against the limit', async () => {
    // 48 stored accounts, 3 of them from this Keystone
    storeAccounts([...others(45), ...seeds(3).map(storedAddress)])
    mockDerivationAccounts = seeds(5).map(keystoneAccount)
    const renderer = await renderScreen()

    expect(showsAccountLimit(renderer)).toBe(false)
    expect(nextDisabled(renderer)).toBe(false)
  })

  it('lifts the block once enough accounts are unselected', async () => {
    storeAccounts(others(48))
    mockDerivationAccounts = seeds(5).map(keystoneAccount)
    const renderer = await renderScreen()

    const rows = renderer.root.findAllByType('PressableScale' as never)
    await act(async () => {
      rows[0].props.onPress()
    })
    await act(async () => {
      rows[1].props.onPress()
    })
    await act(async () => {
      rows[2].props.onPress()
    })

    expect(showsAccountLimit(renderer)).toBe(false)
    expect(nextDisabled(renderer)).toBe(false)
  })
})
