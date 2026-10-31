import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { SuccessReveal } from '../SuccessReveal'

const mockTriggerNotification = jest.fn()
let mockReducedMotion = false

jest.mock(
  '@hooks/useHaptic',
  () => () => ({ triggerNotification: mockTriggerNotification }),
  { virtual: true },
)
// The real token module, so the test reads the values the app ships.
jest.mock(
  '@theme/motion',
  () => ({
    ...jest.requireActual('../../theme/motion'),
    useReducedMotion: () => mockReducedMotion,
  }),
  { virtual: true },
)

// The node test runner cannot load Reanimated. Shared values hold what was
// set, animations are plain descriptions, and builders record their chain.
jest.mock('react-native-reanimated', () => {
  const builder = (name: string) => ({
    duration: (duration: number) => ({
      delay: (delay: number) => ({ name, duration, delay }),
      reduceMotion: (reduceMotion: string) => ({
        name,
        duration,
        reduceMotion,
      }),
    }),
  })
  const ReactActual = jest.requireActual('react')
  return {
    __esModule: true,
    default: { View: 'Animated.View' },
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
    Easing: { bezier: () => 'easeOut' },
    cubicBezier: () => ({}),
    FadeIn: builder('FadeIn'),
    FadeOut: builder('FadeOut'),
    FadeInDown: builder('FadeInDown'),
    useReducedMotion: () => false,
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
    withTiming: (toValue: number, config: object) => ({
      timing: toValue,
      ...config,
    }),
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

const render = (rows: string[]) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <SuccessReveal icon={'icon' as unknown as React.ReactElement}>
        {rows.map((row) => row as unknown as React.ReactElement)}
      </SuccessReveal>,
    )
  })
  const views = () => renderer.root.findAllByType('Animated.View' as never)
  return {
    renderer,
    // The first view holds the icon; each row follows in its own view.
    icon: () => views()[0].props,
    rows: () =>
      views()
        .slice(1)
        .map((view) => view.props),
  }
}

// Spec: the icon fades in over 200ms on EASE_OUT and runs under reduced
// motion; it springs from 0.9 with a 400ms perceived duration and 0.8
// damping; rows fade down over 250ms, 40ms apart, at most six steps.
const FADE = {
  timing: 1,
  duration: 200,
  easing: 'easeOut',
  reduceMotion: 'never',
}
const SPRING = {
  spring: 1,
  duration: 400,
  dampingRatio: 0.8,
  reduceMotion: 'system',
}
const row = (delay: number) => ({ name: 'FadeInDown', duration: 250, delay })

beforeEach(() => {
  mockTriggerNotification.mockClear()
  mockReducedMotion = false
})

describe('SuccessReveal', () => {
  it('starts the icon hidden at 0.9 scale', () => {
    const view = render([])

    expect(view.icon().children).toBe('icon')
    // useAnimatedStyle reads the values set when the view first rendered.
    expect(view.icon().style).toEqual({
      opacity: 0,
      transform: [{ scale: 0.9 }],
    })
  })

  it('animates opacity and scale to 1 on mount', () => {
    const view = render(['a'])
    act(() => {
      view.renderer.update(
        <SuccessReveal icon={'icon' as unknown as React.ReactElement}>
          {'a' as unknown as React.ReactElement}
        </SuccessReveal>,
      )
    })

    expect(view.icon().style).toEqual({
      opacity: FADE,
      transform: [{ scale: SPRING }],
    })
  })

  it('fires one success haptic when it mounts, not on a rerender', () => {
    const view = render(['a'])
    act(() => {
      view.renderer.update(
        <SuccessReveal icon={'icon' as unknown as React.ReactElement}>
          {'b' as unknown as React.ReactElement}
        </SuccessReveal>,
      )
    })

    expect(mockTriggerNotification.mock.calls).toEqual([['success']])
  })

  it('staggers rows 40ms apart and holds rows past the sixth at the last step', () => {
    const view = render(['1', '2', '3', '4', '5', '6', '7'])

    expect(view.rows().map((props) => props.children)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ])
    expect(view.rows().map((props) => props.entering)).toEqual([
      row(0),
      row(40),
      row(80),
      row(120),
      row(160),
      row(200),
      row(200),
    ])
  })

  describe('under reduced motion', () => {
    beforeEach(() => {
      mockReducedMotion = true
    })

    it('fades the icon only, with no scale', () => {
      const view = render([])
      expect(view.icon().style).toEqual({
        opacity: 0,
        transform: [{ scale: 1 }],
      })

      act(() => {
        view.renderer.update(
          <SuccessReveal icon={'icon' as unknown as React.ReactElement} />,
        )
      })
      expect(view.icon().style).toEqual({
        opacity: FADE,
        transform: [{ scale: 1 }],
      })
    })

    it('fades every row in at once', () => {
      const view = render(['1', '2'])
      const fadeIn = { name: 'FadeIn', duration: 200, reduceMotion: 'never' }

      expect(view.rows().map((props) => props.entering)).toEqual([
        fadeIn,
        fadeIn,
      ])
    })

    it('still fires the success haptic', () => {
      render([])
      expect(mockTriggerNotification.mock.calls).toEqual([['success']])
    })
  })
})
