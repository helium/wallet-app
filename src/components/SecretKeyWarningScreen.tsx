import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import InfoWarning from '@assets/images/customWarning.svg'
import { useTranslation } from 'react-i18next'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import globalStyles from '@theme/globalStyles'
import { useColors } from '@theme/themeHooks'
import { useNavigation } from '@react-navigation/native'
import Text from './Text'
import Box from './Box'
import ButtonPressable from './ButtonPressable'

const SecretKeyWarningScreen = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [secondsPassed, setSecondsPassed] = useState(0)
  const animValue = useSharedValue(1)
  const [animationComplete, setAnimationComplete] = useState(false)
  const { primaryBackground, red500 } = useColors()

  useEffect(() => {
    // set interval to update text every second
    const interval = setInterval(() => {
      setSecondsPassed((s) => Math.min(s + 1, 6))
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const goBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const animationCompleted = useCallback(() => {
    setAnimationComplete(true)
  }, [])

  const style = useAnimatedStyle(() => {
    let animVal = animValue.value

    if (animValue.value === 0) {
      animVal = withTiming(
        animValue.value,
        { duration: 300 },
        runOnJS(animationCompleted),
      )
    }
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      position: 'absolute',
      opacity: animVal,
    }
  })

  const handleClose = useCallback(() => {
    animValue.value = 0
  }, [animValue])

  return (
    <View style={globalStyles.container}>
      {children}
      {!animationComplete && (
        <Animated.View style={style}>
          <ScrollView
            style={{
              backgroundColor: primaryBackground,
              flexGrow: 1,
            }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            <Box
              backgroundColor="primaryBackground"
              flex={1}
              justifyContent="center"
              paddingHorizontal="xl"
              height="100%"
            >
              <Box
                justifyContent="center"
                alignItems="center"
                marginBottom="xl"
              >
                <InfoWarning color={red500} height={80} width={80} />
              </Box>
              <Text
                variant="h1"
                textAlign="center"
                fontSize={40}
                adjustsFontSizeToFit
                lineHeight={42}
              >
                {t('secretKeyWarningScreen.title')}
              </Text>

              <Text
                variant="subtitle1"
                color="secondaryText"
                textAlign="center"
                marginTop="m"
                marginHorizontal="l"
                adjustsFontSizeToFit
              >
                {t('secretKeyWarningScreen.body')}
              </Text>

              <ButtonPressable
                borderRadius="round"
                onPress={goBack}
                borderWidth={2}
                borderColor="white"
                backgroundColor="transparent"
                backgroundColorOpacityPressed={0.7}
                titleColorDisabled="secondaryText"
                titleColor="white"
                fontWeight="500"
                title={t('secretKeyWarningScreen.goBack')}
                marginTop="l"
              />

              <ButtonPressable
                disabled={secondsPassed < 5}
                borderRadius="round"
                onPress={handleClose}
                backgroundColor="primaryText"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="surfaceSecondary"
                backgroundColorDisabledOpacity={0.5}
                titleColorDisabled="black500"
                titleColor="primary"
                fontWeight="500"
                title={t('secretKeyWarningScreen.proceed')}
                marginTop="m"
              />

              <Text
                variant="body2Medium"
                color="secondaryText"
                marginTop="m"
                textAlign="center"
                visible={secondsPassed < 5}
              >
                {t('secretKeyWarningScreen.youMayContinueInSeconds', {
                  seconds: 5 - secondsPassed,
                })}
              </Text>
            </Box>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  )
}

export default memo(SecretKeyWarningScreen)
