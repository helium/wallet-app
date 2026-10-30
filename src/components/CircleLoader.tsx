import React, { memo, useRef, useEffect, useState } from 'react'
import { Animated, Easing } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import CircleLoaderSvg from '@assets/images/circleLoader.svg'
import { Color, Theme } from '@theme/theme'
import Box from './Box'
import Text from './Text'

type Props = BoxProps<Theme> & {
  text?: string
  loaderSize?: number
  color?: Color
}
const CircleLoader = ({
  text,
  loaderSize = 30,
  minHeight,
  color = 'white',
  ...props
}: Props) => {
  const [rotateAnim] = useState(() => new Animated.Value(0))
  const [opacityAnim] = useState(() => new Animated.Value(0))
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    const anim = () => {
      animationRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      )
      animationRef.current.start()

      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start()
    }

    const scan = async () => {
      anim()
    }
    void scan()

    return () => {
      if (animationRef.current) {
        animationRef.current.stop()
      }
    }
  }, [rotateAnim, opacityAnim])

  return (
    <Box
      {...props}
      overflow="hidden"
      alignItems="center"
      minHeight={minHeight || loaderSize}
    >
      <Animated.View
        style={{
          flex: 1,
          maxHeight: 105,
          height: loaderSize,
          width: loaderSize,
          opacity: opacityAnim,
          transform: [
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
      >
        <CircleLoaderSvg color={color} height={loaderSize} width={loaderSize} />
      </Animated.View>
      {text && (
        <Text
          textAlign="center"
          variant="body2"
          marginTop="xl"
          color="grey600"
          textTransform="uppercase"
        >
          {text}
        </Text>
      )}
    </Box>
  )
}

export default memo(CircleLoader)
