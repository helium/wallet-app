import React, { memo, ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { AnimatedStyle } from 'react-native-reanimated'
import { FADE_IN, FADE_OUT } from '@theme/motion'

const FadeInOut = ({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>
}) => {
  return (
    <Animated.View entering={FADE_IN} exiting={FADE_OUT} style={style}>
      {children}
    </Animated.View>
  )
}

export default memo(FadeInOut)
