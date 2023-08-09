import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { ReAnimatedBox } from './AnimatedBox'
import Box from './Box'

const ProgressBar = ({
  progress: progressIn,
  ...rest
}: BoxProps<Theme> & { progress: number }) => {
  const HEIGHT = 15

  const [progressRect, setProgressRect] = useState<LayoutRectangle>()

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    e.persist()

    setProgressRect(e.nativeEvent.layout)
  }, [])

  const PROGRESS_WIDTH = useMemo(
    () => (progressRect ? progressRect.width : 0),
    [progressRect],
  )

  const width = useSharedValue(0)

  useEffect(() => {
    // withRepeat to repeat the animation
    width.value = withSpring((progressIn / 100) * PROGRESS_WIDTH)
  }, [PROGRESS_WIDTH, width, progressIn])

  const progress = useAnimatedStyle(() => {
    return {
      width: width.value,
    }
  })

  return (
    <Box
      onLayout={handleLayout}
      {...rest}
      borderRadius="round"
      width="100%"
      height={HEIGHT}
      backgroundColor="transparent10"
      overflow="hidden"
      flexDirection="row"
      justifyContent="flex-start"
    >
      <ReAnimatedBox style={progress}>
        <Box
          height={HEIGHT - 1}
          borderRadius="round"
          backgroundColor="lightGrey"
        />
      </ReAnimatedBox>
    </Box>
  )
}

export default ProgressBar
