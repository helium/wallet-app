import { useNavigation } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import { TriangleAlert } from 'lucide-react-native'
import React, { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { withUniwind } from 'uniwind'

const WarningIcon = withUniwind(TriangleAlert)

// Covers a secret (seed words or private key) with a warning. Proceed unlocks
// after five seconds and fades the warning out.
const SecretKeyWarningScreen = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [secondsPassed, setSecondsPassed] = useState(0)
  const animValue = useSharedValue(1)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    // set interval to update text every second
    const interval = setInterval(() => {
      setSecondsPassed((s) => Math.min(s + 1, 6))
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const animationCompleted = () => {
    setAnimationComplete(true)
  }

  const style = useAnimatedStyle(() => {
    let animVal = animValue.get()

    if (animValue.get() === 0) {
      animVal = withTiming(
        animValue.get(),
        { duration: 300, reduceMotion: ReduceMotion.Never },
        () => scheduleOnRN(animationCompleted),
      )
    }
    return { opacity: animVal }
  })

  return (
    <View className="flex-1">
      {children}
      {!animationComplete && (
        <Animated.View className="absolute inset-0" style={style}>
          <ScrollView
            className="grow bg-background"
            contentContainerClassName="grow justify-center"
          >
            <View className="h-full flex-1 justify-center bg-background px-8">
              <View className="mb-8 items-center justify-center">
                <WarningIcon size={80} colorClassName="accent-destructive" />
              </View>
              <Text
                size="4xl"
                className="text-center font-semibold"
                adjustsFontSizeToFit
              >
                {t('secretKeyWarningScreen.title')}
              </Text>
              <Text
                size="xl"
                className="mx-6 mt-4 text-center font-medium text-muted-foreground"
                adjustsFontSizeToFit
              >
                {t('secretKeyWarningScreen.body')}
              </Text>
              <Button
                variant="outline"
                size="dashboard"
                className="mt-6 w-full"
                onPress={() => navigation.goBack()}
              >
                {t('secretKeyWarningScreen.goBack')}
              </Button>
              <Button
                variant="cta"
                size="dashboard"
                className="mt-4 w-full"
                disabled={secondsPassed < 5}
                onPress={() => animValue.set(0)}
              >
                {t('secretKeyWarningScreen.proceed')}
              </Button>
              {secondsPassed < 5 && (
                <Text className="mt-4 text-center font-medium text-muted-foreground">
                  {t('secretKeyWarningScreen.youMayContinueInSeconds', {
                    seconds: 5 - secondsPassed,
                  })}
                </Text>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  )
}

export default SecretKeyWarningScreen
