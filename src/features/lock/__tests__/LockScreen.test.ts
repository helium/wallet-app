import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import LockScreen from '../LockScreen'

// iOS draws the root view under a presented native controller, so the lock
// overlay must sit in FullWindowOverlay to cover native modal routes.
// FullWindowOverlay is iOS only: Android keeps the plain overlay.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'ios' }
// stable values: LockScreen's effects depend on them
const mockStorage = {
  pin: { status: 'on', value: '1234' },
  authInterval: 0,
  locked: true,
  updateLocked: jest.fn(),
}

// read at render time: the import of LockScreen runs before mockPlatform is set
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatform.OS
    },
  },
}))
jest.mock('react-native-screens', () => ({
  FullWindowOverlay: 'FullWindowOverlay',
}))
jest.mock('react-native-reanimated', () => ({ FadeIn: {}, FadeOutDown: {} }))
jest.mock('react-native-appstate-hook', () => () => ({ appState: 'active' }))
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: String }) }))
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: async () => false,
  isEnrolledAsync: async () => false,
}))
jest.mock(
  '@components/AnimatedBox',
  () => ({ ReAnimatedBox: 'ReAnimatedBox' }),
  {
    virtual: true,
  },
)
jest.mock('@components/ConfirmPinView', () => 'ConfirmPinView', {
  virtual: true,
})
jest.mock(
  '@hooks/useAlert',
  () => {
    const alert = { showOKCancelAlert: jest.fn() }
    return () => alert
  },
  { virtual: true },
)
jest.mock('@hooks/usePrevious', () => () => undefined, { virtual: true })
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accounts = { signOut: jest.fn(), hasAccounts: true }
  return { useAccountStorage: () => accounts }
})
jest.mock('../../../storage/AppStorageProvider', () => ({
  useAppStorage: () => mockStorage,
}))
jest.mock('../../../storage/secureStorage', () => ({
  deleteSecureItem: jest.fn(),
  getSecureItem: async () => null,
  storeSecureItem: jest.fn(),
}))

// async act flushes the useAsync effects
const render = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(
      React.createElement(LockScreen, null, React.createElement('App')),
    )
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('LockScreen overlay', () => {
  beforeEach(() => {
    mockPlatform.OS = 'ios'
    mockStorage.locked = true
  })

  it('draws the PIN pad inside FullWindowOverlay on iOS', async () => {
    const { root } = await render()
    const overlay = root.findByType('FullWindowOverlay' as never)
    const box = overlay.findByType('ReAnimatedBox' as never)
    expect(box.parent).toBe(overlay)
    expect(box.findByType('ConfirmPinView' as never)).toBeTruthy()
    // the app stays outside the overlay, under the PIN pad
    expect(overlay.findAllByType('App' as never)).toHaveLength(0)
    expect(root.findAllByType('App' as never)).toHaveLength(1)
  })

  it('keeps the plain overlay on Android', async () => {
    mockPlatform.OS = 'android'
    const { root } = await render()
    expect(root.findAllByType('FullWindowOverlay' as never)).toHaveLength(0)
    const box = root.findByType('ReAnimatedBox' as never)
    expect(box.findByType('ConfirmPinView' as never)).toBeTruthy()
  })

  it.each(['ios', 'android'])(
    'draws no overlay when unlocked on %s',
    async (os) => {
      mockPlatform.OS = os
      mockStorage.locked = false
      const { root } = await render()
      expect(root.findAllByType('FullWindowOverlay' as never)).toHaveLength(0)
      expect(root.findAllByType('ReAnimatedBox' as never)).toHaveLength(0)
      expect(root.findAllByType('App' as never)).toHaveLength(1)
    },
  )
})
