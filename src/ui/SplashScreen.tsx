import { DUR, EASE_OUT } from '@theme/motion'
import * as SplashLib from 'expo-splash-screen'
import React, { ReactNode, useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'

const SplashScreen = ({ children }: { children: ReactNode }) => {
  const { restored: accountsRestored } = useAccountStorage()
  const { locked } = useAppStorage()
  const [isAppReady, setAppReady] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const animValue = useSharedValue(1)

  useEffect(() => {
    if (isAppReady) {
      animValue.set(0)
    }
  }, [isAppReady, animValue])

  const style = useAnimatedStyle(() => ({
    opacity: withTiming(animValue.get(), {
      duration: DUR.splash,
      easing: EASE_OUT,
      reduceMotion: ReduceMotion.Never,
    }),
  }))

  const onImageLoaded = () => {
    setImageReady(true)
    void SplashLib.hideAsync()
  }

  if (!isAppReady && accountsRestored && imageReady && locked !== undefined) {
    setAppReady(true)
  }

  return (
    <View className="flex-1">
      {isAppReady && children}
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center bg-black"
        style={style}
      >
        <Animated.Image
          className="size-[134px]"
          source={require('../assets/images/SplashLogo.png')}
          onLoadEnd={onImageLoaded}
          fadeDuration={0}
        />
      </Animated.View>
    </View>
  )
}

export default SplashScreen
