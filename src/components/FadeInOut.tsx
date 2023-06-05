import React, { memo, ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

export const FadeInSlow = FadeIn.duration(1200)
export const FadeOutSlow = FadeOut.duration(1200)
export const DelayedFadeIn = FadeIn.delay(100).duration(700)
export const FadeInFast = FadeIn.duration(200)

const FadeInOut = ({
  children,
  style,
  slow,
}: {
  children: ReactNode
  style?: StyleProp<Animated.AnimateStyle<StyleProp<ViewStyle>>>
  slow?: boolean
}) => {
  return (
    <Animated.View
      entering={slow ? FadeInSlow : FadeIn}
      exiting={slow ? FadeOutSlow : FadeOut}
      style={style}
    >
      {children}
    </Animated.View>
  )
}

export default memo(FadeInOut)
