import { Animated } from 'react-native'
import ReAnimated from 'react-native-reanimated'
import Box from './Box'
import BlurBox from './BlurBox'

const AnimatedBox = Animated.createAnimatedComponent(Box)
export const ReAnimatedBox = ReAnimated.createAnimatedComponent(Box)
export const ReAnimatedBlurBox = ReAnimated.createAnimatedComponent(BlurBox)

export default AnimatedBox
