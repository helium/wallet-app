import { pressStyle } from '../pressStyle'

// Reanimated ships ESM that the node test runner cannot load. The token
// module only needs the enum, the easing factory and the hook.
jest.mock('react-native-reanimated', () => ({
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  Easing: { bezier: () => ({ factory: () => (t: number) => t }) },
  useReducedMotion: () => false,
}))

describe('pressStyle', () => {
  it('scales to 0.97 over 120ms on the World ease-out curve while pressed', () => {
    expect(pressStyle({ pressed: true, reducedMotion: false })).toEqual({
      transitionProperty: 'transform',
      transitionDuration: 120,
      transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      transform: [{ scale: 0.97 }],
    })
  })

  it('returns to full size when released', () => {
    expect(pressStyle({ pressed: false, reducedMotion: false })).toEqual({
      transitionProperty: 'transform',
      transitionDuration: 120,
      transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      transform: [{ scale: 1 }],
    })
  })

  it('drops the scale and fades instead under reduced motion', () => {
    expect(pressStyle({ pressed: true, reducedMotion: true })).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: 120,
      transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      opacity: 0.7,
    })
    expect(pressStyle({ pressed: false, reducedMotion: true })).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: 120,
      transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      opacity: 1,
    })
  })
})
