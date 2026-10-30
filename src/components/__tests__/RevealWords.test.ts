import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import RevealWords from '../RevealWords'

// Android hides the seed words from recents, screenshots and screen capture
// with FLAG_SECURE while they show. Settings and onboarding both show them
// through this component.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'android' }
const mockSetSecure = jest.fn((_secure: boolean) => Promise.resolve())

// read at render time: the import of RevealWords runs before mockPlatform is
// set
jest.mock('react-native', () => ({
  Platform: {
    // undefined at import: useSecureWindow reads it before mockPlatform is set
    get OS() {
      return mockPlatform?.OS
    },
  },
  FlatList: 'FlatList',
}))
// the real hook, with the native SecureWindow module mocked
jest.mock(
  '@hooks/useSecureWindow',
  () => jest.requireActual('../../hooks/useSecureWindow'),
  { virtual: true },
)
jest.mock('expo', () => ({
  requireOptionalNativeModule: (name: string) =>
    name === 'SecureWindow'
      ? { setSecure: (secure: boolean) => mockSetSecure(secure) }
      : null,
}))
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: String }) }))
jest.mock('react-native-reanimated', () => ({
  FadeIn: { delay: () => ({}) },
}))
jest.mock('@components/Text', () => 'Text', { virtual: true })
jest.mock(
  '@components/AnimatedBox',
  () => ({ ReAnimatedBox: 'ReAnimatedBox' }),
  { virtual: true },
)
jest.mock('@components/Box', () => 'Box', { virtual: true })
jest.mock('@components/ButtonPressable', () => 'ButtonPressable', {
  virtual: true,
})
jest.mock('@components/TouchableOpacityBox', () => 'TouchableOpacityBox', {
  virtual: true,
})
jest.mock(
  '@theme/themeHooks',
  () => ({
    useColors: () => ({ secondaryText: 'grey' }),
    useSpacing: () => ({ l: 16 }),
  }),
  { virtual: true },
)
jest.mock('@assets/images/copyAddress.svg', () => 'CopyAddress', {
  virtual: true,
})
jest.mock('@hooks/useCopyText', () => () => jest.fn(), { virtual: true })
jest.mock('@hooks/useHaptic', () => () => ({ triggerImpact: jest.fn() }), {
  virtual: true,
})

const render = () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(RevealWords, {
        mnemonic: ['word'],
        onDone: jest.fn(),
      }),
    )
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('RevealWords', () => {
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

  it('sets no flag on iOS', () => {
    mockPlatform.OS = 'ios'
    const renderer = render()
    act(() => renderer.unmount())
    expect(mockSetSecure).not.toHaveBeenCalled()
  })
})
