import { Animated, View } from 'react-native'
import ReAnimated from 'react-native-reanimated'
import { createBox } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import BlurBox from './BlurBox'

// Create animated components from base components instead of Restyle components
const AnimatedView = Animated.createAnimatedComponent(View)
const ReAnimatedView = ReAnimated.createAnimatedComponent(View)

// Create Restyle boxes from the animated components
const AnimatedBox = createBox<Theme>(AnimatedView)
export const ReAnimatedBox = createBox<Theme>(ReAnimatedView)
export const ReAnimatedBlurBox = ReAnimated.createAnimatedComponent(BlurBox)

export default AnimatedBox
