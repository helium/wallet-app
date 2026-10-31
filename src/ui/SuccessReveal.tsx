import useHaptic from '@hooks/useHaptic'
import { DUR, EASE_OUT, FADE_IN, SPRING, useReducedMotion } from '@theme/motion'
import React, { useEffect, useEffectEvent } from 'react'
import Animated, {
  FadeInDown,
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
  const opacity = useSharedValue(0)
  const scale = useSharedValue(reducedMotion ? 1 : ICON_START_SCALE)
  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }))

  const reveal = useEffectEvent(() => {
    opacity.set(withTiming(1, ICON_FADE))
    if (!reducedMotion) scale.set(withSpring(1, SPRING.snap))
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
