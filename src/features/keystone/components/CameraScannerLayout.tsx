import React, { useEffect } from 'react'
import { Image, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'

const SCANNER_SIZE = 300
const SCANNER_LINE_HEIGHT = 43
const SCAN_DURATION = 2000
const BORDER_SEGMENT_SIZE = 40
const CORNER_SIZE = { width: BORDER_SEGMENT_SIZE, height: BORDER_SEGMENT_SIZE }
export const CameraScannerLayout = () => {
  const linePosition = useSharedValue<number>(-SCANNER_LINE_HEIGHT)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: linePosition.get() }],
  }))

  useEffect(() => {
    linePosition.set(
      withRepeat(
        withTiming(SCANNER_SIZE, {
          duration: SCAN_DURATION,
        }),
        -1,
      ),
    )

    return () => {
      cancelAnimation(linePosition)
    }
  }, [linePosition])

  return (
    <View className="absolute inset-0 items-center justify-center bg-background opacity-50">
      <View
        className="relative items-center justify-between overflow-hidden"
        style={{ width: SCANNER_SIZE, height: SCANNER_SIZE }}
      >
        {/* top left */}
        <View
          className="absolute top-0 left-0 border-t-4 border-l-4 border-blue-dark-500"
          style={CORNER_SIZE}
        />
        {/* top right */}
        <View
          className="absolute top-0 right-0 border-t-4 border-r-4 border-blue-dark-500"
          style={CORNER_SIZE}
        />
        {/* bottom left */}
        <View
          className="absolute bottom-0 left-0 border-b-4 border-l-4 border-blue-dark-500"
          style={CORNER_SIZE}
        />
        {/* bottom right */}
        <View
          className="absolute right-0 bottom-0 border-r-4 border-b-4 border-blue-dark-500"
          style={CORNER_SIZE}
        />
        {/* animated scanner line */}
        <Animated.View style={animatedStyle}>
          <Image source={require('../../../assets/images/scannerLine.png')} />
        </Animated.View>
      </View>
    </View>
  )
}
