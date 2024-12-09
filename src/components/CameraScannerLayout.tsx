import React, { useEffect } from 'react'
import { Image } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Box from './Box'

const SCANNER_SIZE = 300
const SCANNER_LINE_HEIGHT = 43
const SCAN_DURATION = 2000
const BORDER_SEGMENT_SIZE = 40
export const CameraScannerLayout = () => {
  const linePosition = useSharedValue<number>(-SCANNER_LINE_HEIGHT)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: linePosition.value }],
  }))

  useEffect(() => {
    linePosition.value = withRepeat(
      withTiming(SCANNER_SIZE, {
        duration: SCAN_DURATION,
      }),
      -1,
    )
  }, [linePosition])

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      justifyContent="center"
      alignItems="center"
      opacity={0.5}
    >
      <Box
        position="relative"
        width={SCANNER_SIZE}
        height={SCANNER_SIZE}
        justifyContent="space-between"
        alignItems="center"
        overflow="hidden"
      >
        {/* top left */}
        <Box
          position="absolute"
          borderColor="hntBlue"
          width={BORDER_SEGMENT_SIZE}
          height={BORDER_SEGMENT_SIZE}
          borderTopWidth={4}
          borderLeftWidth={4}
          top={0}
          left={0}
        />
        {/* top right */}
        <Box
          position="absolute"
          borderColor="hntBlue"
          width={BORDER_SEGMENT_SIZE}
          height={BORDER_SEGMENT_SIZE}
          borderTopWidth={4}
          borderRightWidth={4}
          top={0}
          right={0}
        />
        {/* bottom left */}
        <Box
          position="absolute"
          borderColor="hntBlue"
          width={BORDER_SEGMENT_SIZE}
          height={BORDER_SEGMENT_SIZE}
          borderBottomWidth={4}
          borderLeftWidth={4}
          bottom={0}
          left={0}
        />
        {/* bottom right */}
        <Box
          position="absolute"
          borderColor="hntBlue"
          width={BORDER_SEGMENT_SIZE}
          height={BORDER_SEGMENT_SIZE}
          borderBottomWidth={4}
          borderRightWidth={4}
          bottom={0}
          right={0}
        />
        {/* animated scanner line */}
        <Animated.View style={animatedStyle}>
          <Image source={require('../assets/images/scannerLine.png')} />
        </Animated.View>
      </Box>
    </Box>
  )
}
