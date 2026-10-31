import { SPRING } from '@theme/motion'
import React, { useEffect, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const ProgressBar = ({ progress: progressIn }: { progress: number }) => {
  const HEIGHT = 15

  const [progressRect, setProgressRect] = useState<LayoutRectangle>()

  const handleLayout = (e: LayoutChangeEvent) => {
    e.persist()

    setProgressRect(e.nativeEvent.layout)
  }

  const PROGRESS_WIDTH = progressRect ? progressRect.width : 0

  const width = useSharedValue(0)

  useEffect(() => {
    // withRepeat to repeat the animation
    width.set(withSpring((progressIn / 100) * PROGRESS_WIDTH, SPRING.settle))
  }, [PROGRESS_WIDTH, width, progressIn])

  const progress = useAnimatedStyle(() => {
    return {
      width: width.get(),
    }
  })

  return (
    <View
      onLayout={handleLayout}
      className="w-full flex-row justify-start overflow-hidden rounded-full bg-foreground/10"
      style={{ height: HEIGHT }}
    >
      <Animated.View style={progress}>
        <View
          className="rounded-full bg-primary"
          style={{ height: HEIGHT - 1 }}
        />
      </Animated.View>
    </View>
  )
}

export default ProgressBar
