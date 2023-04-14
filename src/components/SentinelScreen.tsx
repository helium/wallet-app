import React, {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
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
import globalStyles from '@theme/globalStyles'
import HeliumLogo from '@assets/images/helium.svg'
import SolanaLogo from '@assets/images/tokenSOL.svg'
import Multiply from '@assets/images/multiply.svg'
import {
  parseSolanaStatus,
  useGetSolanaStatusQuery,
} from '../store/slices/solanaStatusApi'
import Text from './Text'
import Box from './Box'

const SentinelScreen = ({
  children,
  migrationStatusOverride,
}: {
  children: ReactNode
  migrationStatusOverride?: string
}) => {
  const { t } = useTranslation()
  const { data: status } = useGetSolanaStatusQuery()
  const [showSentinel, setShowSentinel] = useState<boolean>()
  const animValue = useSharedValue(1)
  const [animationComplete, setAnimationComplete] = useState(false)

  const realStatus = useMemo(() => parseSolanaStatus(status), [status])

  const statusWrapper = useMemo(() => {
    const statusCopy = {
      ...realStatus,
      migrationStatus: migrationStatusOverride || realStatus?.migrationStatus,
    }
    return statusCopy
  }, [realStatus, migrationStatusOverride])

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
    if (!statusWrapper || statusWrapper.migrationStatus === 'not_started') {
      setShowSentinel(false)
      return
    }

    const { minimumVersions } = statusWrapper
    const bundleId = DeviceInfo.getBundleId()
    const minVersion = minimumVersions ? minimumVersions[bundleId] : '2.0.0'
    const version = DeviceInfo.getVersion()
    const valid = semver.gte(version, minVersion)

    setShowSentinel(!valid || statusWrapper.migrationStatus !== 'complete')
  }, [statusWrapper])

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
              {t(`sentinel.${statusWrapper?.migrationStatus}.title`)}
            </Text>
            <Box
              marginTop="l"
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
            >
              <Box marginEnd="s">
                <HeliumLogo color="white" height={40} width={40} />
              </Box>
              <Multiply color="white" height={24} width={24} />
              <Box marginStart="s">
                <SolanaLogo color="white" height={40} width={40} />
              </Box>
            </Box>
            <Text
              variant="subtitle1"
              color="secondaryText"
              textAlign="center"
              marginTop="m"
              marginHorizontal="l"
            >
              {t(`sentinel.${statusWrapper?.migrationStatus}.body`)}
            </Text>
          </Box>
        </Animated.View>
      )}
    </View>
  )
}

export default memo(SentinelScreen)
