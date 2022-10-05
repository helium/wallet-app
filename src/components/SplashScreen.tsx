import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import * as SplashLib from 'expo-splash-screen'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useApolloClient } from '../graphql/useApolloClient'
import globalStyles from '../theme/globalStyles'
import { useColors } from '../theme/themeHooks'

const SplashScreen = ({ children }: { children: ReactNode }) => {
  const { client, loading } = useApolloClient()
  const { restored: accountsRestored } = useAccountStorage()
  const [isAppReady, setAppReady] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false)
  const { primaryBackground } = useColors()
  const animValue = useSharedValue(1)

  useEffect(() => {
    if (isAppReady) {
      animValue.value = 0
    }
  }, [isAppReady, animValue.value])

  const animationCompleted = useCallback(() => {
    setAnimationComplete(true)
  }, [])

  const style = useAnimatedStyle(() => {
    const animVal = withTiming(
      animValue.value,
      { duration: 700 },
      runOnJS(animationCompleted),
    )
    return {
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
    if (!accountsRestored || !client || loading || !imageReady) return
    setAppReady(true)
  }, [accountsRestored, client, imageReady, loading])

  return (
    <View style={globalStyles.container}>
      {isAppReady && children}
      {!isSplashAnimationComplete && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, style]}
        >
          <Animated.Image
            style={[
              {
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              },
              style,
            ]}
            source={require('../assets/images/SplashScreen.png')}
            onLoadEnd={onImageLoaded}
            fadeDuration={0}
          />
        </Animated.View>
      )}
    </View>
  )
}

export default memo(SplashScreen)
