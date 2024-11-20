import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { ReAnimatedBox } from './AnimatedBox'
import Box from './Box'
import Text from './Text'

const ProgressBar = ({
  progress: progressIn,
  withLabel = false,
  ...rest
}: BoxProps<Theme> & { progress: number; withLabel?: boolean }) => {
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
    width.value = withTiming((progressIn / 100) * PROGRESS_WIDTH)
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
      borderRadius="full"
      width="100%"
      flexDirection="column"
      justifyContent="flex-start"
      gap="2"
    >
      <Box
        height={HEIGHT}
        backgroundColor="bg.secondary-hover"
        borderRadius="full"
      >
        <ReAnimatedBox style={progress}>
          <Box
            height={HEIGHT}
            borderRadius="full"
            backgroundColor="primaryText"
          />
        </ReAnimatedBox>
      </Box>
      {withLabel && (
        <Text variant="textSmMedium" color="secondaryText" ms="2">
          {`Progress: ${progressIn}%`}
        </Text>
      )}
    </Box>
  )
}

export default ProgressBar
