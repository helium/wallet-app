import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import semver from 'semver'
import InfoError from '@assets/images/infoError.svg'
import { useTranslation } from 'react-i18next'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import globalStyles from '../theme/globalStyles'
import { useGetSolanaStatusQuery } from '../store/slices/solanaStatusApi'
import Text from './Text'
import Box from './Box'
import ButtonPressable from './ButtonPressable'

const SentinelScreen = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const { data: status } = useGetSolanaStatusQuery()
  const [showSentinel, setShowSentinel] = useState<boolean>()
  const animValue = useSharedValue(1)
  const [animationComplete, setAnimationComplete] = useState(false)

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

  useEffect(() => {
    if (!status || status.migrationStatus === 'not_started') return

    const { minimumVersions } = status
    const bundleId = DeviceInfo.getBundleId()
    const minVersion = minimumVersions[bundleId]
    const version = DeviceInfo.getVersion()
    const valid = semver.gte(version, minVersion)
    setShowSentinel(!valid)
  }, [status])

  const handleClose = useCallback(() => {
    animValue.value = 0
  }, [animValue])

  return (
    <View style={globalStyles.container}>
      {children}
      {!!showSentinel && !animationComplete && (
        <Animated.View style={style}>
          <Box
            backgroundColor="primaryBackground"
            flex={1}
            justifyContent="center"
            paddingHorizontal="xl"
          >
            <Box justifyContent="center" alignItems="center" marginBottom="xl">
              <InfoError />
            </Box>
            <Text variant="h1" textAlign="center" fontSize={40} lineHeight={42}>
              {t(`sentinel.${status?.migrationStatus}.title`)}
            </Text>
            <Text
              variant="subtitle1"
              color="secondaryText"
              textAlign="center"
              marginTop="m"
              marginHorizontal="l"
            >
              {t(`sentinel.${status?.migrationStatus}.body`)}
            </Text>

            <ButtonPressable
              borderRadius="round"
              onPress={handleClose}
              backgroundColor="primaryText"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="surfaceSecondary"
              backgroundColorDisabledOpacity={0.5}
              titleColorDisabled="black500"
              titleColor="primary"
              fontWeight="500"
              title={t('sentinel.action')}
              marginTop="l"
            />
          </Box>
        </Animated.View>
      )}
    </View>
  )
}

export default memo(SentinelScreen)
