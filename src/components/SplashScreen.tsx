import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import * as SplashLib from 'expo-splash-screen'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import globalStyles from '@theme/globalStyles'
import { EASE_OUT } from '@theme/motion'
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
      animValue.set(0)
    }
  }, [isAppReady, animValue])

  const style = useAnimatedStyle(() => ({
    opacity: withTiming(animValue.get(), { duration: 300, easing: EASE_OUT }),
    backgroundColor: primaryBackground,
  }))

  const onImageLoaded = useCallback(async () => {
    setImageReady(true)
    void SplashLib.hideAsync()
  }, [])

  if (!isAppReady && accountsRestored && imageReady && locked !== undefined) {
    setAppReady(true)
  }

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
          style={styles.image}
          source={require('../assets/images/SplashScreen.png')}
          onLoadEnd={onImageLoaded}
          fadeDuration={0}
        />
      </ReAnimatedBox>
    </View>
  )
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
})

export default memo(SplashScreen)
