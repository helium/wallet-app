import React, { memo, ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, {
  AnimatedStyle,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated'
import { DUR } from '@theme/motion'

const entering = FadeIn.duration(DUR.enter)
const exiting = FadeOut.duration(DUR.enter * DUR.exitFactor)

const FadeInOut = ({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>
}) => {
  return (
    <Animated.View entering={entering} exiting={exiting} style={style}>
      {children}
    </Animated.View>
  )
}

export default memo(FadeInOut)
