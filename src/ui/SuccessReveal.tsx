import useHaptic from '@hooks/useHaptic'
import { DUR, EASE_OUT, FADE_IN, SPRING, useReducedMotion } from '@theme/motion'
import React, { useEffect, useEffectEvent } from 'react'
import Animated, {
  FadeInDown,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

export type SuccessRevealProps = {
  icon: React.ReactNode
  children?: React.ReactNode
}

const ICON_START_SCALE = 0.9
const ICON_FADE = {
  duration: DUR.enter,
  easing: EASE_OUT,
  reduceMotion: ReduceMotion.Never,
}

// Rows fade down 40ms apart. Rows past the sixth enter with the sixth.
const ROW_ENTERING = Array.from({ length: 6 }, (_, index) =>
  FadeInDown.duration(250).delay(index * 40),
)

// The success moment of a completed send or claim: the icon fades in and
// springs up from 0.9, the rows below it follow in a short stagger, and one
// success haptic fires as the icon starts. Reduced motion keeps the fades and
// drops the scale and the stagger.
export const SuccessReveal = ({ icon, children }: SuccessRevealProps) => {
  const reducedMotion = useReducedMotion()
  const { triggerNotification } = useHaptic()
  // The fade runs on a timing curve and the scale on a spring, so each has
  // its own 0-to-1 progress.
  const fadeProgress = useSharedValue(0)
  const scaleProgress = useSharedValue(reducedMotion ? 1 : 0)
  const iconStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.get(),
    transform: [
      {
        scale: interpolate(scaleProgress.get(), [0, 1], [ICON_START_SCALE, 1]),
      },
    ],
  }))

  const reveal = useEffectEvent(() => {
    fadeProgress.set(withTiming(1, ICON_FADE))
    if (!reducedMotion) scaleProgress.set(withSpring(1, SPRING.snap))
    triggerNotification('success')
  })

  useEffect(() => {
    reveal()
  }, [])

  return (
    <>
      <Animated.View style={iconStyle}>{icon}</Animated.View>
      {React.Children.toArray(children).map((row, index) => (
        <Animated.View
          key={React.isValidElement(row) ? row.key : index}
          entering={
            reducedMotion
              ? FADE_IN
              : ROW_ENTERING[Math.min(index, ROW_ENTERING.length - 1)]
          }
        >
          {row}
        </Animated.View>
      ))}
    </>
  )
}
