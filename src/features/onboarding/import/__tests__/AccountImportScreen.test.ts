import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AccountImportScreen from '../AccountImportScreen'

// Android hides the seed words the user types from recents, screenshots and
// screen capture with FLAG_SECURE while the import screen shows.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'android' }
const mockSetSecure = jest.fn((_secure: boolean) => Promise.resolve())

jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('react-native', () => ({
  Platform: {
    // undefined at import: useSecureWindow reads it before mockPlatform is set
    get OS() {
      return mockPlatform?.OS
    },
  },
  FlatList: 'FlatList',
  View: 'View',
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
  const navigation = { addListener: () => () => undefined }
  const route = { params: {} }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
}))
jest.mock(
  '@ui/FocusAwareStatusBar',
  () => ({ FocusAwareStatusBar: 'FocusAwareStatusBar' }),
  { virtual: true },
)
jest.mock('uniwind', () => ({ withUniwind: () => 'Icon' }))
jest.mock('lucide-react-native', () => ({ X: 'X' }))
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock(
  '@hooks/useAlert',
  () => {
    const alert = { showOKAlert: jest.fn() }
    return () => alert
  },
  { virtual: true },
)
jest.mock('../../../../storage/AccountStorageProvider', () => {
  const storage = { restoreSecureAccounts: jest.fn(), hasAccounts: false }
  return { useAccountStorage: () => storage }
})
jest.mock('../../../../storage/secureStorage', () => ({
  mnemonicDeriver: jest.fn(),
  toSecureAccount: jest.fn(),
}))
jest.mock('../../OnboardingProvider', () => {
  const onboarding = { setOnboardingData: jest.fn(), reset: jest.fn() }
  return { useOnboarding: () => onboarding }
})
jest.mock('../PassphraseAutocomplete', () => 'PassphraseAutocomplete')
jest.mock('../accountRestore', () => ({ matchRestoredAccounts: jest.fn() }))

const render = () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(React.createElement(AccountImportScreen))
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('AccountImportScreen', () => {
  beforeEach(() => {
    mockPlatform.OS = 'android'
    mockSetSecure.mockClear()
  })

  it('hides the app from capture on Android while the words show', () => {
    const renderer = render()
    expect(mockSetSecure.mock.calls).toEqual([[true]])
    act(() => renderer.unmount())
    expect(mockSetSecure.mock.calls).toEqual([[true], [false]])
  })
})
