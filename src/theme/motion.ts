import { Easing, ReduceMotion, useReducedMotion } from 'react-native-reanimated'

// The only source of motion values. withTiming stays at or under 300ms
// (actual time). Springs use only the SPRING presets, never an inline config;
// their duration is perceived time, capped at 400 (settle, snap) and 300
// (sheet). Reduced motion follows the OS: keep fades, drop translate, scale,
// stagger and overshoot.

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
  exitFactor: 0.8,
}

export const SPRING = {
  settle: { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System },
  snap: { duration: 400, dampingRatio: 0.8, reduceMotion: ReduceMotion.System },
  sheet: {
    duration: 300,
    dampingRatio: 0.8,
    reduceMotion: ReduceMotion.System,
  },
}

// Sheet motion for gorhom. gorhom runs any config with `duration` as
// withTiming, so SPRING.sheet would lose its damping there. Sheets use
// EASE_SHEET over the sheet duration instead.
export const SHEET_TIMING = {
  duration: SPRING.sheet.duration,
  easing: EASE_SHEET,
  reduceMotion: ReduceMotion.System,
}

export { useReducedMotion }
