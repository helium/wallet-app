import { Keypair } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AccountAssignScreen from '../AccountAssignScreen'

// The device keychain
const mockKeychain = new Map<string, string>()
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  {
    virtual: true,
  },
)
jest.mock('expo-secure-store', () => ({
  setItemAsync: async (key: string, value: string) => {
    mockKeychain.set(key, value)
  },
  getItemAsync: async (key: string) => mockKeychain.get(key) ?? null,
  deleteItemAsync: async (key: string) => {
    mockKeychain.delete(key)
  },
}))
// The screen's aliased imports resolve to the real modules
jest.mock(
  '@storage/secureStorage',
  () => jest.requireActual('../../../storage/secureStorage'),
  { virtual: true },
)
jest.mock(
  '@utils/accountUtils',
  () => jest.requireActual('../../../utils/accountUtils'),
  { virtual: true },
)
jest.mock('@storage/cloudStorage', () => ({}), { virtual: true })
jest.mock('@hooks/useDerivationAccounts', () => ({}), { virtual: true })
jest.mock('../../../navigation/NavigationHelper', () => ({}))
jest.mock('../../../utils/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}))
jest.mock('@helium/crypto-react-native', () => ({}))
// Native module that accountUtils imports; the screen never uses it
jest.mock('bcrypt-react-native', () => ({}))
// The address is the Solana address, so the test knows each stored key's name
jest.mock('@helium/spl-utils', () => ({
  heliumAddressFromSolAddress: (solanaAddress: string) => solanaAddress,
}))

jest.mock('react-native', () => ({
  Alert: { alert: () => {} },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'ios' },
  View: 'View',
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ ArrowRight: 'ArrowRight' }))
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock(
  '@ui/FocusAwareStatusBar',
  () => ({ FocusAwareStatusBar: 'FocusAwareStatusBar' }),
  { virtual: true },
)
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Checkbox', () => ({ Checkbox: 'Checkbox' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })

jest.mock('@react-navigation/native', () => {
  const navigation = { navigate: () => {}, reset: () => {} }
  const route = { params: {} }
  return { useNavigation: () => navigation, useRoute: () => route }
})
// mutate runs the mutation, so the press returns once the save settles
jest.mock('@tanstack/react-query', () => ({
  useMutation: ({ mutationFn }: { mutationFn: () => Promise<void> }) => ({
    mutate: mutationFn,
    isPending: false,
  }),
}))
// Each test may set an RPC connection; without one every balance reads 0
let mockConnection: { getBalance: () => Promise<number> } | undefined
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: () => ({ connection: mockConnection }),
}))

// Each test sets the import's keypairs and the stored account list.
let mockPaths: { keypair: Keypair; derivationPath: string }[] = []
jest.mock('../OnboardingProvider', () => ({
  useOnboarding: () => ({
    reset: () => {},
    onboardingData: { paths: mockPaths, words: ['word'] },
  }),
}))
let mockAccounts: Record<string, { address: string; alias: string }> = {}
const mockUpsertAccounts = jest.fn()
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = {
    get accounts() {
      return mockAccounts
    },
    get hasAccounts() {
      return Object.keys(mockAccounts).length > 0
    },
    upsertAccounts: (...args: unknown[]) => mockUpsertAccounts(...args),
    setCurrentAccount: () => {},
    updateDefaultAccountAddress: async () => {},
  }
  return { useAccountStorage: () => accountStorage }
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const saveFailed = new Error('save failed')

const path = (keypair: Keypair) => ({
  keypair,
  derivationPath: "m/44'/501'/0'/0'",
})

const listAccount = (keypair: Keypair) => {
  const address = keypair.publicKey.toBase58()
  mockAccounts[address] = { address, alias: 'Listed' }
}

// Names the account, presses Continue, and waits for the save to settle
const assignAccounts = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<AccountAssignScreen />)
  })
  if (!renderer) throw new Error('render failed')
  const screen = renderer
  await act(async () => {
    screen.root.findByType('Input' as never).props.onChangeText('Wallet')
  })
  await act(async () => {
    await screen.root.findByType('Button' as never).props.onPress()
  })
}

const storedAddresses = () => [...mockKeychain.keys()]

beforeEach(() => {
  mockKeychain.clear()
  mockAccounts = {}
  mockConnection = undefined
  mockUpsertAccounts.mockReset()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('AccountAssignScreen', () => {
  it('stores no key for an address the list does not hold when the save fails', async () => {
    mockPaths = [path(Keypair.generate()), path(Keypair.generate())]
    mockUpsertAccounts.mockRejectedValue(saveFailed)

    await assignAccounts()

    expect(mockUpsertAccounts).toHaveBeenCalledTimes(1)
    expect(storedAddresses()).toEqual([])
  })

  it('keeps the key of a listed account when the save fails', async () => {
    const listed = Keypair.generate()
    const unlisted = Keypair.generate()
    listAccount(listed)
    mockPaths = [path(listed), path(unlisted)]
    mockUpsertAccounts.mockRejectedValue(saveFailed)

    await assignAccounts()

    expect(mockUpsertAccounts).toHaveBeenCalledTimes(1)
    expect(storedAddresses()).toEqual([listed.publicKey.toBase58()])
  })

  it('stores no key when a balance read fails', async () => {
    mockPaths = [path(Keypair.generate()), path(Keypair.generate())]
    mockConnection = {
      getBalance: () => Promise.reject(new Error('rpc failed')),
    }

    await assignAccounts()

    expect(mockUpsertAccounts).not.toHaveBeenCalled()
    expect(storedAddresses()).toEqual([])
  })

  it('keeps every new key when the save succeeds', async () => {
    const first = Keypair.generate()
    const second = Keypair.generate()
    mockPaths = [path(first), path(second)]
    mockUpsertAccounts.mockResolvedValue(undefined)

    await assignAccounts()

    expect(storedAddresses().sort()).toEqual(
      [first.publicKey.toBase58(), second.publicKey.toBase58()].sort(),
    )
  })
})
