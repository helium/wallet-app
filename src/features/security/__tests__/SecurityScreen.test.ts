import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import SecurityScreen from '../SecurityScreen'

// iOS draws the root view under a presented native controller, so the
// app-switcher cover must sit in FullWindowOverlay to hide native modal routes
// (seed words included). Android renders nothing here and has no app-switcher
// cover.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'ios' }

// fade-out start callbacks; real Animated runs them when the timing ends or
// stops, so a test ends them with mockEndFadeOuts
const mockPendingFadeOuts: Array<(result: { finished: boolean }) => void> = []
const mockEndFadeOuts = (finished: boolean) =>
  mockPendingFadeOuts.splice(0).forEach((done) => done({ finished }))
// toValue of every timing started, in order
const mockTimings: number[] = []

// read at render time: the import of SecurityScreen runs before mockPlatform
// is set
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatform.OS
    },
  },
  Image: 'Image',
  View: 'View',
  Animated: {
    Value: class {},
    createAnimatedComponent: (component: unknown) => component,
    timing: (_value: unknown, config: { toValue: number }) => ({
      start: (done?: (result: { finished: boolean }) => void) => {
        mockTimings.push(config.toValue)
        if (!done) return
        if (config.toValue === 0) mockPendingFadeOuts.push(done)
        else done({ finished: true })
      },
    }),
  },
}))
jest.mock('react-native-screens', () => ({
  FullWindowOverlay: 'FullWindowOverlay',
}))
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
    mockPendingFadeOuts.length = 0
    mockTimings.length = 0
  })

  it('draws the cover inside FullWindowOverlay on iOS', () => {
    const { root } = render(true)
    const overlay = root.findByType('FullWindowOverlay' as never)
    const box = overlay.findByType('View' as never)
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

  it('keeps the cover when the app leaves again during the fade-out', () => {
    const renderer = render(true)
    act(() => {
      renderer.update(React.createElement(SecurityScreen, { visible: false }))
    })
    act(() => {
      renderer.update(React.createElement(SecurityScreen, { visible: true }))
    })
    act(() => {
      mockEndFadeOuts(true)
    })
    expect(
      renderer.root.findAllByType('FullWindowOverlay' as never),
    ).toHaveLength(1)
  })
  it('removes the cover when the fade-out ends while the app is active', () => {
    const renderer = render(true)
    act(() => {
      renderer.update(React.createElement(SecurityScreen, { visible: false }))
    })
    act(() => {
      mockEndFadeOuts(true)
    })
    expect(renderer.toJSON()).toBeNull()
  })

  it('fades the cover back in when the app leaves during the fade-out', () => {
    const renderer = render(true)
    act(() => {
      renderer.update(React.createElement(SecurityScreen, { visible: false }))
    })
    mockTimings.length = 0
    act(() => {
      renderer.update(React.createElement(SecurityScreen, { visible: true }))
    })
    expect(mockTimings).toEqual([1])
  })
})
