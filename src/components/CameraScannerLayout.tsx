import React, { useEffect } from 'react'
import { View, StyleSheet, Image } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

const SCANNER_SIZE = 300
const SCANNER_LINE_HEIGHT = 43
const SCAN_DURATION = 2000

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
    <View style={styles.container}>
      <View style={styles.scanner}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <Animated.View style={animatedStyle}>
          <Image source={require('../assets/images/scannerLine.png')} />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanner: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    width: 40,
    height: 40,
    borderColor: '#2755F8',
    position: 'absolute',
  },
  topLeft: {
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
  },
  topRight: {
    borderTopWidth: 4,
    borderRightWidth: 4,
    top: 0,
    right: 0,
  },
  bottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    bottom: 0,
    right: 0,
  },
})
