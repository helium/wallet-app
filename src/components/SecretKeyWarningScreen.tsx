import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
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
import Text from './Text'
import Box from './Box'
import ButtonPressable from './ButtonPressable'
import { BackScreen } from '.'
import ScrollBox from './ScrollBox'

const SecretKeyWarningScreen = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const [secondsPassed, setSecondsPassed] = useState(0)
  const animValue = useSharedValue(1)
  const [animationComplete, setAnimationComplete] = useState(false)
  const { primaryBackground, ...colors } = useColors()

  useEffect(() => {
    // set interval to update text every second
    const interval = setInterval(() => {
      setSecondsPassed((s) => Math.min(s + 1, 6))
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

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
          <ScrollBox
            style={{
              backgroundColor: primaryBackground,
              flexGrow: 1,
            }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            <BackScreen edges={[]} headerTopMargin="6xl" padding="6">
              <Box
                backgroundColor="primaryBackground"
                flex={1}
                justifyContent="center"
                height="100%"
                gap="4"
              >
                <Box justifyContent="center" alignItems="center">
                  <InfoWarning
                    color={colors['error.500']}
                    height={80}
                    width={80}
                  />
                </Box>
                <Text
                  variant="displayMdRegular"
                  textAlign="center"
                  fontSize={40}
                  adjustsFontSizeToFit
                  lineHeight={42}
                >
                  {t('secretKeyWarningScreen.title')}
                </Text>

                <Text
                  variant="textXlMedium"
                  color="secondaryText"
                  textAlign="center"
                  adjustsFontSizeToFit
                >
                  {t('secretKeyWarningScreen.body')}
                </Text>

                <ButtonPressable
                  disabled={secondsPassed < 5}
                  borderRadius="full"
                  onPress={handleClose}
                  backgroundColor="primaryText"
                  backgroundColorOpacityPressed={0.7}
                  backgroundColorDisabled="bg.tertiary"
                  backgroundColorDisabledOpacity={0.5}
                  titleColorDisabled="text.disabled"
                  titleColor="primaryBackground"
                  fontWeight="500"
                  title={t('secretKeyWarningScreen.proceed')}
                  marginTop="4"
                  marginBottom="6xl"
                />

                <Text
                  variant="textSmMedium"
                  color="secondaryText"
                  marginTop="4"
                  textAlign="center"
                  visible={secondsPassed < 5}
                >
                  {t('secretKeyWarningScreen.youMayContinueInSeconds', {
                    seconds: 5 - secondsPassed,
                  })}
                </Text>
              </Box>
            </BackScreen>
          </ScrollBox>
        </Animated.View>
      )}
    </View>
  )
}

export default memo(SecretKeyWarningScreen)
