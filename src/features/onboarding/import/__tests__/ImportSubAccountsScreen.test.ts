import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ImportSubAccountsScreen from '../ImportSubAccountsScreen'

// The screen copies the selected accounts into the onboarding data. That copy
// must settle: a write on every render loops the provider and the screen.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockSetOnboardingData = jest.fn()
const mockAccounts = [
  {
    derivationPath: "m/44'/501'/0'/0'",
    keypair: { publicKey: { toBase58: () => 'pubkey' } },
    balance: 0,
    tokens: [],
    needsMigrated: false,
  },
]
const mockDerivation = {
  error: undefined,
  loading: false,
  derivationAccounts: mockAccounts,
  fetchMore: () => undefined,
}

jest.mock('@ui/TabSafeAreaView', () => ({ TabSafeAreaView: 'SafeAreaView' }), {
  virtual: true,
})
jest.mock('react-native', () => ({
  FlatList: 'FlatList',
  RefreshControl: 'RefreshControl',
  View: 'View',
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: () => 'SafeArea' }))
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: String }) }))
jest.mock('@react-navigation/native', () => {
  const navigation = { replace: jest.fn() }
  return { useNavigation: () => navigation }
})
jest.mock('@helium/helium-react-hooks', () => ({
  useMint: () => ({ info: undefined }),
}))
jest.mock(
  '@hooks/useDerivationAccounts',
  () => ({ useDerivationAccounts: () => mockDerivation }),
  { virtual: true },
)
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({}) }),
  { virtual: true },
)
jest.mock(
  '@ui/FocusAwareStatusBar',
  () => ({ FocusAwareStatusBar: 'FocusAwareStatusBar' }),
  { virtual: true },
)
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Checkbox', () => ({ Checkbox: 'Checkbox' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@utils/accountUtils', () => ({ ellipsizeAddress: String }), {
  virtual: true,
})
jest.mock('@utils/formatting', () => ({ humanReadable: () => '0' }), {
  virtual: true,
})
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const storage = { hasAccounts: false }
    return { useAccountStorage: () => storage }
  },
  { virtual: true },
)
jest.mock(
  '@storage/secureStorage',
  () => ({ DEFAULT_DERIVATION_PATH: "m/44'/501'/0'/0'" }),
  { virtual: true },
)
// Holds the onboarding data in state, as OnboardingProvider does, so that
// each write renders the screen again. It stops after 20 writes so that a
// loop ends the test instead of hanging it.
jest.mock('../../OnboardingProvider', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useCallback, useState } = require('react')
  return {
    useOnboarding: () => {
      const [onboardingData, setData] = useState({ words: ['a'] })
      return {
        onboardingData,
        // stable, as a useState setter is
        setOnboardingData: useCallback((update: unknown) => {
          mockSetOnboardingData(update)
          if (mockSetOnboardingData.mock.calls.length <= 20) setData(update)
        }, []),
      }
    },
  }
})

describe('ImportSubAccountsScreen', () => {
  it('writes the selected accounts once, not on every render', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(ImportSubAccountsScreen),
      )
    })
    expect(mockSetOnboardingData.mock.calls.length).toBeLessThanOrEqual(2)
    act(() => renderer?.unmount())
  })
})
