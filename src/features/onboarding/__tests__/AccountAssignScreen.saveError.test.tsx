import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AccountAssignScreen from '../AccountAssignScreen'

jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  {
    virtual: true,
  },
)
jest.mock('react-native', () => ({
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'ios' },
  View: 'View',
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0 }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ ArrowRight: 'ArrowRight' }))
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('@ui/FocusAwareStatusBar', () => ({ FocusAwareStatusBar: 'Bar' }), {
  virtual: true,
})
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Checkbox', () => ({ Checkbox: 'Checkbox' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@storage/cloudStorage', () => ({}), { virtual: true })
jest.mock('@hooks/useDerivationAccounts', () => ({}), { virtual: true })
jest.mock('@utils/accountUtils', () => ({ accountNetType: () => 'mainnet' }), {
  virtual: true,
})
jest.mock(
  '@storage/secureStorage',
  () => ({
    deleteSecureAccount: jest.fn(async () => undefined),
    storeSecureAccount: jest.fn(async () => undefined),
    toSecureAccount: jest.fn(() => ({})),
  }),
  { virtual: true },
)
jest.mock('@helium/spl-utils', () => ({
  heliumAddressFromSolAddress: (address: string) => `helium-${address}`,
}))
const mockReset = jest.fn()
const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => {
  const navigation = {
    reset: (...args: unknown[]) => mockReset(...args),
    navigate: (...args: unknown[]) => mockNavigate(...args),
  }
  const route = { params: undefined }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('../../../solana/SolanaProvider', () => {
  const solana = { connection: { getBalance: async () => 0 } }
  return { useSolana: () => solana }
})
const mockUpsertAccounts = jest.fn()
const mockSetCurrentAccount = jest.fn()
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = {
    accounts: {},
    hasAccounts: true,
    setCurrentAccount: (...args: unknown[]) => mockSetCurrentAccount(...args),
    updateDefaultAccountAddress: jest.fn(),
    upsertAccounts: (...args: unknown[]) => mockUpsertAccounts(...args),
  }
  return { useAccountStorage: () => accountStorage }
})
jest.mock('../OnboardingProvider', () => {
  const { Keypair } = jest.requireActual('@solana/web3.js')
  const onboarding = {
    reset: jest.fn(),
    onboardingData: {
      paths: [
        {
          keypair: Keypair.fromSeed(new Uint8Array(32).fill(1)),
          derivationPath: "m/44'/501'/0'/0'",
        },
      ],
      words: ['word'],
    },
  }
  return { useOnboarding: () => onboarding }
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const byTestId = (renderer: TestRenderer.ReactTestRenderer, testID: string) =>
  renderer.root.find(
    (n) => n.props.testID === testID && typeof n.type === 'string',
  )

beforeEach(() => {
  mockReset.mockReset()
  mockNavigate.mockReset()
  mockSetCurrentAccount.mockReset()
  mockUpsertAccounts.mockReset()
})

describe('AccountAssignScreen', () => {
  it('shows the save error and stays on the screen when the accounts fail to save', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    mockUpsertAccounts.mockRejectedValue(new Error('write failed'))
    let renderer!: TestRenderer.ReactTestRenderer
    await act(async () => {
      renderer = TestRenderer.create(
        <QueryClientProvider client={new QueryClient()}>
          <AccountAssignScreen />
        </QueryClientProvider>,
      )
    })

    await act(async () => {
      byTestId(renderer, 'AccountAssign.Alias').props.onChangeText('Main')
    })
    await act(async () => {
      byTestId(renderer, 'AccountAssign.Continue').props.onPress()
    })

    expect(mockUpsertAccounts).toHaveBeenCalledTimes(1)
    const shown = renderer.root
      .findAllByType('Text' as never)
      .map((n) => n.props.children)
    expect(shown).toContain('Error: write failed')
    expect(mockReset).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockSetCurrentAccount).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
