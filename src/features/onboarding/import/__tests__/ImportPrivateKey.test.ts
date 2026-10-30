import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ImportPrivateKey from '../ImportPrivateKey'

// Android hides the private key the user pastes from recents, screenshots and
// screen capture with FLAG_SECURE while the import screen shows.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'android' }
const mockSetSecure = jest.fn((_secure: boolean) => Promise.resolve())

jest.mock('react-native', () => ({
  Platform: {
    // undefined at import: useSecureWindow reads it before mockPlatform is set
    get OS() {
      return mockPlatform?.OS
    },
  },
}))
// the real hook, with the native SecureWindow module mocked
jest.mock(
  '@hooks/useSecureWindow',
  () => jest.requireActual('../../../../hooks/useSecureWindow'),
  { virtual: true },
)
jest.mock('expo', () => ({
  requireOptionalNativeModule: (name: string) =>
    name === 'SecureWindow'
      ? { setSecure: (secure: boolean) => mockSetSecure(secure) }
      : null,
}))
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: String }) }))
jest.mock('@react-navigation/native', () => {
  const navigation = { canGoBack: () => false }
  const route = { params: {} }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('@solana/web3.js', () => ({ Keypair: {} }))
jest.mock('@helium/crypto-react-native', () => ({ Mnemonic: {} }))
jest.mock('@hooks/useDerivationAccounts', () => ({ HELIUM_DERIVATION: '' }), {
  virtual: true,
})
jest.mock(
  '@utils/crypto',
  () => ({
    decryptPasswordProtectedData: jest.fn(),
    extractEd25519Seed: jest.fn(),
  }),
  { virtual: true },
)
jest.mock('@utils/logger', () => ({ error: jest.fn() }), { virtual: true })
jest.mock('@components/BackButton', () => 'BackButton', { virtual: true })
jest.mock('@components/Box', () => 'Box', { virtual: true })
jest.mock('@components/ButtonPressable', () => 'ButtonPressable', {
  virtual: true,
})
jest.mock('@components/SafeAreaBox', () => 'SafeAreaBox', { virtual: true })
jest.mock('@components/Text', () => 'Text', { virtual: true })
jest.mock('@components/TextInput', () => 'TextInput', { virtual: true })
jest.mock('../../../../storage/AccountStorageProvider', () => {
  const storage = { hasAccounts: false }
  return { useAccountStorage: () => storage }
})
jest.mock('../../../../storage/secureStorage', () => ({
  DEFAULT_DERIVATION_PATH: '',
  createKeypair: jest.fn(),
}))
jest.mock('../../OnboardingProvider', () => {
  const onboarding = { setOnboardingData: jest.fn(), onboardingData: {} }
  return { useOnboarding: () => onboarding }
})

const render = () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(React.createElement(ImportPrivateKey))
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('ImportPrivateKey', () => {
  beforeEach(() => {
    mockPlatform.OS = 'android'
    mockSetSecure.mockClear()
  })

  it('hides the app from capture on Android while the key shows', () => {
    const renderer = render()
    expect(mockSetSecure.mock.calls).toEqual([[true]])
    act(() => renderer.unmount())
    expect(mockSetSecure.mock.calls).toEqual([[true], [false]])
  })
})
