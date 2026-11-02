import { SPRING } from '@theme/motion'
import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

// The fill scales from its left edge, so it grows rightward.
const LEFT_ORIGIN = { transformOrigin: 'left' }

const ProgressBar = ({ progress: progressIn }: { progress: number }) => {
  const HEIGHT = 15

  // The scanned fraction, from 0 to 1.
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.set(withSpring(progressIn / 100, SPRING.settle))
  }, [progress, progressIn])

  const fillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleX: progress.get() }],
    }
  })

  return (
    <View
      className="w-full flex-row justify-start overflow-hidden rounded-full bg-foreground/10"
      style={{ height: HEIGHT }}
    >
      <Animated.View className="w-full" style={[LEFT_ORIGIN, fillStyle]}>
        <View
          className="rounded-full bg-primary"
          style={{ height: HEIGHT - 1 }}
        />
      </Animated.View>
    </View>
  )
}

export default ProgressBar
