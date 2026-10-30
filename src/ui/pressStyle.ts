import type { GestureResponderEvent } from 'react-native'
import { DUR, EASE_OUT_CSS, PRESS } from '../theme/motion'

export type PressFeedback = 'scale' | 'opacity'

// The press primitive as a Reanimated CSS transition. Opacity feedback (rows
// and links) and reduced motion change opacity instead of scale.
export const pressStyle = ({
  pressed,
  reducedMotion,
  disabled,
  feedback = 'scale',
}: {
  pressed: boolean
  reducedMotion: boolean
  disabled: boolean
  feedback?: PressFeedback
}) => {
  const transition = {
    transitionDuration: DUR.press,
    transitionTimingFunction: EASE_OUT_CSS,
  } as const

  return reducedMotion || feedback === 'opacity'
    ? {
        transitionProperty: 'opacity' as const,
        ...transition,
        ...(disabled ? {} : { opacity: pressed ? PRESS.opacity : 1 }),
      }
    : {
        transitionProperty: 'transform' as const,
        ...transition,
        transform: [{ scale: pressed ? PRESS.scale : 1 }],
      }
}

export const pressWithHaptic = (
  onPress: ((event: GestureResponderEvent) => void) | null | undefined,
  haptic: () => void,
) =>
  onPress
    ? (event: GestureResponderEvent) => {
        haptic()
        onPress(event)
      }
    : undefined
