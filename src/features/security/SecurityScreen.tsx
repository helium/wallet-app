import React, { useEffect, memo, useMemo, useRef, useState } from 'react'
import { Animated, ImageStyle, Image, Platform } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
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
  const visibleRef = useRef(visible)

  useEffect(() => {
    visibleRef.current = visible
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()
      return
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // the app can leave again during the fade-out; keep the cover then
      if (finished && !visibleRef.current) setMounted(false)
    })
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
    // android ui doesn't update after "background" is detected in RN, so no
    // cover renders here. FLAG_SECURE (useSecureWindow) is on while a screen
    // that shows a seed phrase or key is mounted. A native stack keeps a
    // covered screen mounted, so the flag stays on until that screen pops
    // (for onboarding, until the create flow ends). Other screens show in
    // recents.

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
