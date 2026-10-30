import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import RevealPrivateKeyScreen from '../RevealPrivateKeyScreen'

// Android hides the private key from recents, screenshots and screen capture
// with FLAG_SECURE while the screen shows.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'android' }
const mockSetSecure = jest.fn((_secure: boolean) => Promise.resolve())

// read at render time: the import of the screen runs before mockPlatform is set
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
  () => jest.requireActual('../../../hooks/useSecureWindow'),
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
  useNavigation: () => ({ goBack: jest.fn() }),
}))
jest.mock('@components/Text', () => 'Text', { virtual: true })
jest.mock('@components/Box', () => 'Box', { virtual: true })
jest.mock('@components/ButtonPressable', () => 'ButtonPressable', {
  virtual: true,
})
jest.mock('@components/BackScreen', () => 'BackScreen', { virtual: true })
jest.mock('@components/TextTransform', () => 'TextTransform', {
  virtual: true,
})
jest.mock('@components/TouchableOpacityBox', () => 'TouchableOpacityBox', {
  virtual: true,
})
jest.mock('@components/CopyAddress', () => 'CopyAddress', { virtual: true })
jest.mock(
  '@hooks/useAlert',
  () => {
    const alert = { showOKCancelAlert: jest.fn() }
    return () => alert
  },
  { virtual: true },
)
jest.mock('../../../storage/secureStorage', () => ({
  getSecureAccount: jest.fn(),
}))
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accounts = { currentAccount: { address: 'address' } }
  return { useAccountStorage: () => accounts }
})

const render = () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(React.createElement(RevealPrivateKeyScreen))
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('RevealPrivateKeyScreen', () => {
  beforeEach(() => {
    mockPlatform.OS = 'android'
    mockSetSecure.mockClear()
  })

  it('hides the app from capture on Android while it shows', () => {
    const renderer = render()
    expect(mockSetSecure.mock.calls).toEqual([[true]])
    act(() => renderer.unmount())
    expect(mockSetSecure.mock.calls).toEqual([[true], [false]])
  })

  it('sets no flag on iOS', () => {
    mockPlatform.OS = 'ios'
    const renderer = render()
    act(() => renderer.unmount())
    expect(mockSetSecure).not.toHaveBeenCalled()
  })
})
