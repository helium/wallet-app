import {
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated'

// Motion values for new and touched code. withTiming stays at or under 300ms
// (actual time). Every spring uses a SPRING preset; no spring config lives
// outside this module. Their duration is perceived time, capped at 400
// (settle, snap) and 300 (sheet). A sheet stops at rest, with no overshoot,
// so a bottom-anchored sheet never lifts off the screen edge. Reduced
// motion follows the OS: fades always run (the FADE_* builders and opacity
// timings use ReduceMotion.Never); translate, scale, stagger and overshoot
// drop.

export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1)
export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1)

// EASE_OUT as a CSS timing function, for Reanimated CSS transitions.
export const EASE_OUT_CSS = 'cubic-bezier(0.23, 1, 0.32, 1)'

// Press primitive: scale while pressed. Reduced motion fades instead.
export const PRESS = { scale: 0.97, opacity: 0.7 }

export const DUR = {
  press: 120,
  state: 150,
  enter: 200,
  splash: 300,
  exitFactor: 0.8,
}

// Fades are the motion reduced motion keeps, so they never snap.
export const FADE_IN = FadeIn.duration(DUR.enter).reduceMotion(
  ReduceMotion.Never,
)
export const FADE_OUT = FadeOut.duration(
  DUR.enter * DUR.exitFactor,
).reduceMotion(ReduceMotion.Never)
export const FADE_IN_STATE = FadeIn.duration(DUR.state).reduceMotion(
  ReduceMotion.Never,
)
export const FADE_OUT_STATE = FadeOut.duration(DUR.state).reduceMotion(
  ReduceMotion.Never,
)

export const SPRING = {
  settle: { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System },
  snap: { duration: 400, dampingRatio: 0.8, reduceMotion: ReduceMotion.System },
  sheet: {
    duration: 300,
    dampingRatio: 0.8,
    overshootClamping: true,
    reduceMotion: ReduceMotion.System,
  },
}

export { useReducedMotion }
