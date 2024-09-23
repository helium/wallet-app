import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import * as SplashLib from 'expo-splash-screen'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import globalStyles from '@theme/globalStyles'
import { useColors } from '@theme/themeHooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { ReAnimatedBox } from './AnimatedBox'

const SplashScreen = ({ children }: { children: ReactNode }) => {
  const { restored: accountsRestored } = useAccountStorage()
  const { locked } = useAppStorage()
  const [isAppReady, setAppReady] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const { primaryBackground } = useColors()
  const animValue = useSharedValue(1)

  useEffect(() => {
    if (isAppReady) {
      animValue.value = 0
    }
  }, [isAppReady, animValue])

  const style = useAnimatedStyle(() => {
    const animVal = withTiming(animValue.value, { duration: 700 })
    return {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      opacity: animVal,
      backgroundColor: primaryBackground,
      transform: [
        {
          scale: animVal,
        },
      ],
    }
  })

  const onImageLoaded = useCallback(async () => {
    setImageReady(true)
    SplashLib.hideAsync()
  }, [])

  useEffect(() => {
    if (!accountsRestored || !imageReady || locked === undefined) return
    setAppReady(true)
  }, [accountsRestored, imageReady, locked])

  return (
    <View style={globalStyles.container}>
      {isAppReady && children}
      <ReAnimatedBox
        pointerEvents="none"
        top={0}
        left={0}
        right={0}
        bottom={0}
        position="absolute"
        style={style}
      >
        <Animated.Image
          style={style}
          source={require('../assets/images/SplashScreen.png')}
          onLoadEnd={onImageLoaded}
          fadeDuration={0}
        />
      </ReAnimatedBox>
    </View>
  )
}

export default memo(SplashScreen)
