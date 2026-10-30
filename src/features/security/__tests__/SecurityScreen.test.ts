import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import SecurityScreen from '../SecurityScreen'

// iOS draws the root view under a presented native controller, so the
// app-switcher cover must sit in FullWindowOverlay to hide native modal routes
// (seed words included). Android hides the app with FLAG_SECURE and renders
// nothing here.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'ios' }

// read at render time: the import of SecurityScreen runs before mockPlatform
// is set
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatform.OS
    },
  },
  Image: 'Image',
  Animated: {
    Value: class {},
    createAnimatedComponent: (component: unknown) => component,
    timing: () => ({ start: (done?: () => void) => done?.() }),
  },
}))
jest.mock('react-native-screens', () => ({
  FullWindowOverlay: 'FullWindowOverlay',
}))
jest.mock('@components/Box', () => 'Box', { virtual: true })
jest.mock('../../../assets/images/SplashScreen.png', () => 'SplashScreen.png')

const render = (visible: boolean) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(SecurityScreen, { visible }),
    )
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('SecurityScreen', () => {
  beforeEach(() => {
    mockPlatform.OS = 'ios'
  })

  it('draws the cover inside FullWindowOverlay on iOS', () => {
    const { root } = render(true)
    const overlay = root.findByType('FullWindowOverlay' as never)
    const box = overlay.findByType('Box' as never)
    expect(box.parent).toBe(overlay)
    expect(box.findByType('Image' as never).props.source).toBe(
      'SplashScreen.png',
    )
  })

  it('renders nothing on Android', () => {
    mockPlatform.OS = 'android'
    expect(render(true).toJSON()).toBeNull()
  })

  it('renders nothing on iOS while the app is active', () => {
    expect(render(false).toJSON()).toBeNull()
  })
})
