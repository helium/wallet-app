import { ReduceMotion } from 'react-native-reanimated'
import { DUR, SPRING } from '../motion'

// Reanimated ships ESM that the node test runner cannot load. The token
// module only needs the enum, the easing factory and the hook.
jest.mock('react-native-reanimated', () => ({
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  Easing: { bezier: () => ({ factory: () => (t: number) => t }) },
  useReducedMotion: () => false,
}))

describe('motion tokens', () => {
  it('uses the World durations for press, small state and dialog entrance', () => {
    expect(DUR).toEqual({ press: 120, state: 150, enter: 200, exitFactor: 0.8 })
  })

  it('keeps every timing at or under 300ms', () => {
    const timings = [DUR.press, DUR.state, DUR.enter]
    timings.forEach((ms) => expect(ms).toBeLessThanOrEqual(300))
  })

  it('caps spring perceived duration at 400ms, and 300ms for sheets', () => {
    expect(SPRING.settle).toMatchObject({ duration: 400, dampingRatio: 1 })
    expect(SPRING.snap).toMatchObject({ duration: 400, dampingRatio: 0.8 })
    expect(SPRING.sheet).toMatchObject({ duration: 300, dampingRatio: 0.8 })
  })

  it('makes every spring follow the OS reduced motion setting', () => {
    Object.values(SPRING).forEach((spring) =>
      expect(spring.reduceMotion).toBe(ReduceMotion.System),
    )
  })
})
