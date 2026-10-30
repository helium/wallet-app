import { ReduceMotion } from 'react-native-reanimated'
import {
  DUR,
  EASE_SHEET,
  FADE_IN,
  FADE_IN_STATE,
  FADE_OUT,
  FADE_OUT_STATE,
  SHEET_TIMING,
  SPRING,
} from '../motion'

// Reanimated ships ESM that the node test runner cannot load. The token
// module only needs the enum, the easing factory, the fade builders and the
// hook. The builder fakes record the duration and reduceMotion they get.
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

type FakeFade = { kind: string; ms: number; rm: string }

describe('motion tokens', () => {
  it('keeps every timing at or under 300ms', () => {
    const timings = [
      DUR.press,
      DUR.state,
      DUR.enter,
      DUR.splash,
      DUR.enter * DUR.exitFactor,
    ]
    timings.forEach((ms) => expect(ms).toBeLessThanOrEqual(300))
  })

  it('caps spring perceived duration at 400ms, and 300ms for sheets', () => {
    expect(SPRING.settle.duration).toBeLessThanOrEqual(400)
    expect(SPRING.snap.duration).toBeLessThanOrEqual(400)
    expect(SPRING.sheet.duration).toBeLessThanOrEqual(300)
  })

  it('stops a sheet at its rest position, with no overshoot', () => {
    expect(SPRING.sheet.overshootClamping).toBe(true)
  })

  it('makes every spring follow the OS reduced motion setting', () => {
    Object.values(SPRING).forEach((spring) =>
      expect(spring.reduceMotion).toBe(ReduceMotion.System),
    )
  })

  it('keeps every fade running under reduced motion', () => {
    const fades = [FADE_IN, FADE_OUT, FADE_IN_STATE, FADE_OUT_STATE]
    fades.forEach((fade) => {
      const { ms, rm } = fade as unknown as FakeFade
      expect(rm).toBe(ReduceMotion.Never)
      expect(ms).toBeLessThanOrEqual(300)
    })
  })

  it('gives gorhom sheets a 300ms timing on the sheet curve', () => {
    // gorhom runs any config with `duration` as withTiming, so the sheet
    // motion is a timing config, held to the 300ms withTiming cap.
    expect(SHEET_TIMING).toEqual({
      duration: 300,
      easing: EASE_SHEET,
      reduceMotion: ReduceMotion.System,
    })
  })
})
