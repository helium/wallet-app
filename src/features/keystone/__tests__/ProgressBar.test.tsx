import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ProgressBar from '../components/ProgressBar'

// The node test runner cannot load react-native or Reanimated. Shared values
// hold what was set, and a spring is a plain description of its target.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock(
  '@theme/motion',
  () => ({
    SPRING: {
      settle: { duration: 400, dampingRatio: 1, reduceMotion: 'system' },
    },
  }),
  { virtual: true },
)
jest.mock('react-native-reanimated', () => {
  const ReactActual = jest.requireActual('react')
  return {
    __esModule: true,
    default: { View: 'Animated.View' },
    useSharedValue: (initial: unknown) => {
      const [shared] = ReactActual.useState(() => {
        let value = initial
        return {
          get: () => value,
          set: (next: unknown) => {
            value = next
          },
        }
      })
      return shared
    },
    useAnimatedStyle: (style: () => unknown) => style(),
    withSpring: (toValue: number, config: object) => ({
      spring: toValue,
      ...config,
    }),
  }
})

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const SETTLE = { duration: 400, dampingRatio: 1, reduceMotion: 'system' }

const render = (progress: number) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<ProgressBar progress={progress} />)
  })
  const bar = () =>
    renderer.root.findByType('Animated.View' as never).props.style
  return { renderer, bar }
}

// The bar fills from its left edge by scaling, so no frame runs layout.
describe('ProgressBar', () => {
  it('starts empty, scaled from its left edge', () => {
    const view = render(0)

    expect(view.bar()).toEqual([
      { transformOrigin: 'left' },
      { transform: [{ scaleX: 0 }] },
    ])
  })

  it('springs the fill to the scanned fraction', () => {
    const view = render(0)
    act(() => {
      view.renderer.update(<ProgressBar progress={40} />)
    })
    // The next render reads the spring set by the effect.
    act(() => {
      view.renderer.update(<ProgressBar progress={40} />)
    })

    expect(view.bar()).toEqual([
      { transformOrigin: 'left' },
      { transform: [{ scaleX: { spring: 0.4, ...SETTLE } }] },
    ])
  })
})
