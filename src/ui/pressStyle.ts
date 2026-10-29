import { DUR, EASE_OUT_CSS, PRESS } from '../theme/motion'

// The press primitive as a Reanimated CSS transition. Reduced motion drops
// the scale and keeps an opacity change.
export const pressStyle = ({
  pressed,
  reducedMotion,
}: {
  pressed: boolean
  reducedMotion: boolean
}) => {
  const transition = {
    transitionDuration: DUR.press,
    transitionTimingFunction: EASE_OUT_CSS,
  } as const

  return reducedMotion
    ? {
        transitionProperty: 'opacity' as const,
        ...transition,
        opacity: pressed ? PRESS.opacity : 1,
      }
    : {
        transitionProperty: 'transform' as const,
        ...transition,
        transform: [{ scale: pressed ? PRESS.scale : 1 }],
      }
}
