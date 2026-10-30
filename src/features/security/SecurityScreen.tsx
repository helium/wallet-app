import React, { useEffect, memo, useRef, useMemo, useState } from 'react'
import { Animated, ImageStyle, Image, Platform } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
import Box from '@components/Box'

const AnimatedImage = Animated.createAnimatedComponent(Image)

type Props = { visible: boolean }
const SecurityScreen = ({ visible }: Props) => {
  const fadeAnim = useRef(new Animated.Value(0))
  const [mounted, setMounted] = useState(false)
  const visibleRef = useRef(visible)

  const fadeIn = () => {
    setMounted(true)
    Animated.timing(fadeAnim.current, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }

  const fadeOut = () => {
    Animated.timing(fadeAnim.current, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visibleRef.current) setMounted(false)
    })
  }

  useEffect(() => {
    if (mounted) {
      fadeIn()
    }
  }, [mounted])

  useEffect(() => {
    visibleRef.current = visible
    if (visible) {
      if (mounted) {
        fadeIn()
      } else {
        setMounted(true)
      }
    } else {
      fadeOut()
    }
    // only a change of visible starts a fade; mounted is read, not watched
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const style = useMemo(
    () =>
      ({
        opacity: fadeAnim.current,
        height: '100%',
        width: '100%',
      } as Animated.AnimatedProps<ImageStyle>),
    [],
  )

  if (Platform.OS === 'android' || !mounted) {
    // android ui doesn't update after "background" is detected in RN, so no
    // cover renders here. FLAG_SECURE (useSecureWindow) hides the secret
    // screens; the rest of the app shows in recents.

    return null
  }

  // iOS draws the root view under native modal routes; FullWindowOverlay
  // draws above the modals presented before it mounts
  return (
    <FullWindowOverlay>
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
    </FullWindowOverlay>
  )
}

export default memo(SecurityScreen)
