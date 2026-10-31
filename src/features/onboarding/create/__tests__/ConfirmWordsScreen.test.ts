import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ConfirmWordsScreen from '../ConfirmWordsScreen'

// Android hides the seed words from recents, screenshots and screen capture
// with FLAG_SECURE while the user confirms them. Onboarding and the Settings
// sign-out check both show the real mnemonic here.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true
// the screen renders a skip button in dev builds
Object.assign(global, { __DEV__: false })

const mockPlatform = { OS: 'android' }
const mockSetSecure = jest.fn((_secure: boolean) => Promise.resolve())

jest.mock('react-native', () => ({
  Platform: {
    // undefined at import: useSecureWindow reads it before mockPlatform is set
    get OS() {
      return mockPlatform?.OS
    },
  },
  Animated: {
    Value: class {},
    View: 'AnimatedView',
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
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ canGoBack: () => false, goBack: jest.fn() }),
}))
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
}))
jest.mock('@components/FocusAwareStatusBar', () => 'FocusAwareStatusBar', {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('lucide-react-native', () => ({ X: 'X' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('@hooks/useHaptic', () => () => ({ triggerImpact: jest.fn() }), {
  virtual: true,
})
jest.mock('../../import/PassphraseAutocomplete', () => 'PassphraseAutocomplete')

const render = () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(ConfirmWordsScreen, {
        mnemonic: ['word'],
        onComplete: jest.fn(),
      }),
    )
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('ConfirmWordsScreen', () => {
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
