import { BoxProps } from '@shopify/restyle'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutRectangle, LayoutChangeEvent } from 'react-native'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Theme } from '@theme/theme'
import { ReAnimatedBox } from './AnimatedBox'
import Box from './Box'

const IndeterminateProgressBar = ({ ...rest }: BoxProps<Theme>) => {
  const HEIGHT = 15
  const DURATION = 1200

  const [progressRect, setProgressRect] = useState<LayoutRectangle>()

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    e.persist()

    setProgressRect(e.nativeEvent.layout)
  }, [])

  const PROGRESS_WIDTH = useMemo(
    () => (progressRect ? progressRect.width : 0),
    [progressRect],
  )

  const translateX = useSharedValue(-PROGRESS_WIDTH * 1.25)

  useEffect(() => {
    // withRepeat to repeat the animation
    translateX.value = withRepeat(
      // withDelay to add a delay to our animation
      withDelay(
        0,
        withTiming(PROGRESS_WIDTH * 1.25, {
          // Set the bezier curve function as the timing animation easing
          easing: Easing.inOut(Easing.ease),
          duration: DURATION,
        }),
      ),
      // Set number of repetitions to -1 to loop indefinitely
      -1,
    )
  }, [PROGRESS_WIDTH, translateX])

  const progress = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value - PROGRESS_WIDTH * 0.5 }],
    }
  })

  return (
    <Box
      onLayout={handleLayout}
      {...rest}
      borderRadius="round"
      width="100%"
      height={rest.height || HEIGHT}
      backgroundColor="transparent10"
      overflow="hidden"
    >
      <ReAnimatedBox style={progress}>
        <Box
          width={PROGRESS_WIDTH / 2}
          height={rest.height || HEIGHT - 1}
          borderRadius="round"
          backgroundColor="lightGrey"
        />
      </ReAnimatedBox>
    </Box>
  )
}

export default IndeterminateProgressBar
