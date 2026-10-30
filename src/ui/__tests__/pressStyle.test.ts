import type { GestureResponderEvent } from 'react-native'
import { pressStyle, pressWithHaptic } from '../pressStyle'

// Reanimated ships ESM that the node test runner cannot load. The token
// module only needs the enum, the easing factories, the fade builders and the
// hook.
jest.mock('react-native-reanimated', () => {
  const builder = (kind: string) => ({
    duration: (ms: number) => ({
      kind,
      ms,
      reduceMotion: (rm: string) => ({ kind, ms, rm }),
    }),
  })
  return {
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
    Easing: { bezier: () => ({ factory: () => (t: number) => t }) },
    cubicBezier: (x1: number, y1: number, x2: number, y2: number) => ({
      name: 'cubicBezier',
      x1,
      y1,
      x2,
      y2,
    }),
    FadeIn: builder('in'),
    FadeOut: builder('out'),
    useReducedMotion: () => false,
  }
})

const EASE_OUT = { name: 'cubicBezier', x1: 0.23, y1: 1, x2: 0.32, y2: 1 }

describe('pressStyle', () => {
  it('scales to 0.97 over 120ms on the World ease-out curve while pressed', () => {
    expect(
      pressStyle({ pressed: true, reducedMotion: false, disabled: false }),
    ).toEqual({
      transitionProperty: 'transform',
      transitionDuration: 120,
      transitionTimingFunction: EASE_OUT,
      transform: [{ scale: 0.97 }],
    })
  })

  it('returns to full size when released', () => {
    expect(
      pressStyle({ pressed: false, reducedMotion: false, disabled: false }),
    ).toEqual({
      transitionProperty: 'transform',
      transitionDuration: 120,
      transitionTimingFunction: EASE_OUT,
      transform: [{ scale: 1 }],
    })
  })

  it('drops the scale and fades instead under reduced motion', () => {
    expect(
      pressStyle({ pressed: true, reducedMotion: true, disabled: false }),
    ).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: 120,
      transitionTimingFunction: EASE_OUT,
      opacity: 0.7,
    })
    expect(
      pressStyle({ pressed: false, reducedMotion: true, disabled: false }),
    ).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: 120,
      transitionTimingFunction: EASE_OUT,
      opacity: 1,
    })
  })

  it('sets no opacity under reduced motion when disabled, so the dim class holds', () => {
    const style = pressStyle({
      pressed: false,
      reducedMotion: true,
      disabled: true,
    })
    expect(style).not.toHaveProperty('opacity')
    expect(style).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: 120,
      transitionTimingFunction: EASE_OUT,
    })
  })

  it('passes Reanimated an easing object, not a CSS string', () => {
    expect(
      typeof pressStyle({
        pressed: true,
        reducedMotion: false,
        disabled: false,
      }).transitionTimingFunction,
    ).not.toBe('string')
  })
})

describe('pressWithHaptic', () => {
  it('returns no handler when there is no onPress', () => {
    const haptic = jest.fn()
    expect(pressWithHaptic(undefined, haptic)).toBeUndefined()
    expect(pressWithHaptic(null, haptic)).toBeUndefined()
  })

  it('fires the haptic once, then the caller once with the same event', () => {
    const calls: string[] = []
    const haptic = jest.fn(() => calls.push('haptic'))
    const onPress = jest.fn(() => calls.push('onPress'))
    const event = {} as GestureResponderEvent

    pressWithHaptic(onPress, haptic)?.(event)

    expect(haptic).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledWith(event)
    expect(calls).toEqual(['haptic', 'onPress'])
  })
})
