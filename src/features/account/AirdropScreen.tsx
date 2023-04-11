import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import * as solUtils from '@utils/solanaUtils'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import SafeAreaBox from '@components/SafeAreaBox'
import TokenIcon from '@components/TokenIcon'
import { Edge } from 'react-native-safe-area-context'
import DripLogo from '@assets/images/dripLogo.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Text from '@components/Text'
import axios from 'axios'
import * as logger from '@utils/logger'
import CircleLoader from '@components/CircleLoader'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'

const DROP_HEIGHT = 79

type Route = RouteProp<HomeStackParamList, 'AirdropScreen'>

const AirdropScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { currentAccount, anchorProvider } = useAccountStorage()
  const { t } = useTranslation()
  const ring = useSharedValue(0)
  const ringDrop = useSharedValue(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const route = useRoute<Route>()
  const { ticker } = route.params

  const onAirdrop = useCallback(async () => {
    if (!currentAccount?.solanaAddress || !anchorProvider) return

    setLoading(true)
    if (ticker === 'SOL') {
      solUtils.airdrop(anchorProvider, currentAccount?.solanaAddress)
      setLoading(false)
      navigation.goBack()
    } else {
      try {
        await axios.get(
          `https://faucet.web.test-helium.com/${ticker.toLowerCase()}/${
            currentAccount?.solanaAddress
          }?amount=2)`,
        )

        setLoading(false)
        navigation.goBack()
      } catch (error) {
        setLoading(false)
        logger.error(error)
        setErrorMessage((error as Error).message)
      }
    }
  }, [anchorProvider, currentAccount, navigation, ticker])

  const edges = useMemo(() => ['bottom'] as Edge[], [])

  const onAnimationDropComplete = useCallback(() => {
    ring.value = 1
  }, [ring])

  const onAnimationComplete = useCallback(() => {
    ringDrop.value = 1
    ring.value = 0
  }, [ringDrop, ring])

  const ringStyle = useAnimatedStyle(() => {
    let ringVal = ring.value

    if (ring.value === 1) {
      ringVal = withRepeat(
        withTiming(
          ring.value,
          {
            duration: 2000,
          },
          runOnJS(onAnimationComplete),
        ),
        -1,
      )
    }

    return {
      transform: [
        {
          scale: ringVal,
        },
        {
          translateY: interpolate(0, [0, 1], [DROP_HEIGHT / 2, 800]),
        },
      ],
    }
  })

  const dropStyle = useAnimatedStyle(() => {
    let ringDropVal = DROP_HEIGHT / 2
    if (ringDrop.value === 1) {
      ringDropVal = withRepeat(
        withDelay(
          2000,
          withTiming(
            800,
            {
              duration: 2000,
            },
            runOnJS(onAnimationDropComplete),
          ),
        ),
        -1,
      )
    }

    return {
      transform: [
        {
          translateY: ringDropVal,
        },
      ],
    }
  }, [ringDrop])

  useEffect(() => {
    ring.value = 1
  }, [ring, ringDrop])

  return (
    <BackScreen headerBackgroundColor="black" flex={1} padding="none">
      <SafeAreaBox edges={edges} backgroundColor="black" flex={1}>
        <Box>
          <Text variant="h4" textAlign="center" marginTop="l">
            {t('airdropScreen.title')}
          </Text>
          <Text
            variant="body1"
            textAlign="center"
            color="secondaryText"
            marginTop="m"
          >
            {t('airdropScreen.subtitle')}
          </Text>
        </Box>
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
          marginBottom="l"
        >
          <Box justifyContent="center" alignItems="center">
            <TokenIcon size={160} ticker={ticker} white />
            <Box position="absolute" top={120}>
              <ReAnimatedBox style={[ringStyle, dropStyle]}>
                <DripLogo />
              </ReAnimatedBox>
            </Box>
          </Box>
        </Box>
        <Text variant="body1" textAlign="center" color="red500" marginTop="m">
          {errorMessage ? t('airdropScreen.error') : ''}
        </Text>
        <ButtonPressable
          borderRadius="round"
          onPress={onAirdrop}
          backgroundColor="primaryText"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="black500"
          titleColor="primary"
          fontWeight="500"
          title={!loading ? t('airdropScreen.airdropTicker', { ticker }) : ''}
          disabled={loading}
          marginVertical="l"
          marginHorizontal="l"
          LeadingComponent={
            loading && <CircleLoader loaderSize={20} color="white" />
          }
        />
      </SafeAreaBox>
    </BackScreen>
  )
}

export default memo(AirdropScreen)
