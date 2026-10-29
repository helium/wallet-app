import * as SplashLib from 'expo-splash-screen'
import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import {
  type ButtonSize,
  type ButtonVariant,
  buttonTextVariants,
  buttonVariants,
} from './buttonVariants'

// Throwaway screen that checks Uniwind on this stack: World's theme.css
// tokens, cva variants, Reanimated components and React Compiler output.
const SWATCHES = [
  'bg-background border border-border',
  'bg-primary',
  'bg-secondary',
  'bg-muted',
  'bg-destructive',
  'bg-off-white',
  'bg-status-healthy',
  'bg-purple-500',
  'bg-blue-dark-500',
  'bg-sidebar-primary',
]

const RADII = ['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl']

const VARIANTS: ButtonVariant[] = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
]

const SIZES: ButtonSize[] = ['sm', 'default', 'lg', 'icon']

const UniwindSpikeScreen = () => {
  const [presses, setPresses] = useState(0)
  const offset = useSharedValue(0)

  useEffect(() => {
    // App.tsx holds the native splash until the app's splash hides it.
    void SplashLib.hideAsync()
    offset.set(withRepeat(withTiming(1, { duration: 800 }), -1, true))
  }, [offset])

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() * 120 }],
  }))

  return (
    <ScrollView
      className="flex-1 bg-off-white"
      contentContainerClassName="gap-4 px-4 pt-16 pb-8"
    >
      <Text className="text-2xl font-semibold text-foreground">
        Uniwind spike
      </Text>
      <Text className="text-sm text-muted-foreground">
        World theme.css tokens
      </Text>

      <View className="flex-row flex-wrap gap-2 rounded-lg border border-border bg-card p-4">
        {SWATCHES.map((swatch) => (
          <View key={swatch} className={`size-10 rounded-md ${swatch}`} />
        ))}
      </View>

      <View className="flex-row gap-2">
        {RADII.map((radius) => (
          <View key={radius} className={`size-12 bg-primary ${radius}`} />
        ))}
      </View>

      <Text className="text-sm text-muted-foreground">cva variants</Text>
      {VARIANTS.map((variant) => (
        <View key={variant} className="flex-row items-center gap-2">
          {SIZES.map((size) => (
            <Pressable
              key={size}
              className={buttonVariants({ variant, size })}
              onPress={() => setPresses((count) => count + 1)}
            >
              <Text className={buttonTextVariants({ variant })}>
                {size === 'icon' ? '+' : variant}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
      <Pressable
        disabled
        className={buttonVariants({ variant: 'default', size: 'default' })}
      >
        <Text className={buttonTextVariants({ variant: 'default' })}>
          disabled
        </Text>
      </Pressable>

      <Text className="text-sm text-muted-foreground">
        className from state (compiled component)
      </Text>
      <View
        className={`h-12 items-center justify-center rounded-lg ${
          presses % 2 === 0 ? 'bg-success-500' : 'bg-warning-400'
        }`}
      >
        <Text className="text-base font-medium text-white">
          {`presses: ${presses}`}
        </Text>
      </View>

      <Text className="text-sm text-muted-foreground">Reanimated</Text>
      <Animated.View
        className="size-12 rounded-lg bg-purple-600"
        style={slide}
      />
      <Animated.View
        entering={FadeIn.duration(600)}
        className={buttonVariants({ variant: 'secondary', size: 'lg' })}
      >
        <Text className={buttonTextVariants({ variant: 'secondary' })}>
          entering FadeIn
        </Text>
      </Animated.View>
    </ScrollView>
  )
}

export default UniwindSpikeScreen
