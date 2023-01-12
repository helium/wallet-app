import React, { useMemo } from 'react'
import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import BlurBox from './BlurBox'
import Text from './Text'
import SafeAreaBox from './SafeAreaBox'

type Props = BottomSheetBackdropProps & {
  title?: string
  onPress?: () => void
}

const CustomBlurBackdrop = ({
  animatedIndex,
  style,
  title,
  onPress,
}: Props) => {
  // animated variables
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolate.CLAMP,
    ),
  }))

  // styles
  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: 'transparent',
      },
      containerAnimatedStyle,
    ],
    [style, containerAnimatedStyle],
  )

  return (
    <Animated.View onTouchEnd={onPress} style={containerStyle}>
      <BlurBox position="absolute" top={0} bottom={0} left={0} right={0}>
        <SafeAreaBox
          edges={['top']}
          backgroundColor="transparent"
          alignItems="center"
          width="100%"
        >
          <Text marginHorizontal="l" textAlign="center" variant="h4">
            {title || ''}
          </Text>
        </SafeAreaBox>
      </BlurBox>
    </Animated.View>
  )
}

export default CustomBlurBackdrop
