import { ComponentProps } from 'react'
import { Animated, View } from 'react-native'
import ReAnimated from 'react-native-reanimated'
import { createBox } from '@shopify/restyle'
import { BlurView } from 'expo-blur'
import { Theme } from '@theme/theme'

// Restyle outside, animated view inside. Reanimated 4.4+ re-renders the
// component it wraps with settled style values as props; on a Restyle
// component those values hit the theme lookup and throw.
const AnimatedView = Animated.createAnimatedComponent(View)
const ReAnimatedBlurView = ReAnimated.createAnimatedComponent(BlurView)

const AnimatedBox = createBox<Theme, ComponentProps<typeof AnimatedView>>(
  AnimatedView,
)
export const ReAnimatedBox = createBox<
  Theme,
  ComponentProps<typeof ReAnimated.View>
>(ReAnimated.View)
export const ReAnimatedBlurBox = createBox<
  Theme,
  ComponentProps<typeof ReAnimatedBlurView>
>(ReAnimatedBlurView)

export default AnimatedBox
