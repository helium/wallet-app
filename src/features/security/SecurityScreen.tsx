import React, { useEffect, memo, useMemo, useState } from 'react'
import { Animated, ImageStyle, Image, Platform } from 'react-native'
import Box from '@components/Box'

const AnimatedImage = Animated.createAnimatedComponent(Image)

type Props = { visible: boolean }
const SecurityScreen = ({ visible }: Props) => {
  const [fadeAnim] = useState(() => new Animated.Value(0))
  const [mounted, setMounted] = useState(visible)
  const [prevVisible, setPrevVisible] = useState(visible)
  if (visible !== prevVisible) {
    setPrevVisible(visible)
    if (visible) setMounted(true)
  }

  useEffect(() => {
    if (mounted) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()
    }
  }, [fadeAnim, mounted])

  useEffect(() => {
    if (!visible) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMounted(false))
    }
  }, [fadeAnim, visible])

  const style = useMemo(
    () =>
      ({
        opacity: fadeAnim,
        height: '100%',
        width: '100%',
      }) as Animated.AnimatedProps<ImageStyle>,
    [fadeAnim],
  )

  if (Platform.OS === 'android' || !mounted) {
    // android ui doesn't update after "background" is detected in RN.
    // We're using WindowManager.LayoutParams.FLAG_SECURE in
    // MainActivity.java to hide the view.

    return null
  }

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="primaryBackground"
    >
      <AnimatedImage
        style={style}
        source={require('../../assets/images/SplashScreen.png')}
      />
    </Box>
  )
}

export default memo(SecurityScreen)
