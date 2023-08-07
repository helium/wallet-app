import DripLogo from '@assets/images/dripLogo.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import * as logger from '@utils/logger'
import * as solUtils from '@utils/solanaUtils'
import axios from 'axios'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'

const DROP_HEIGHT = 79

type Route = RouteProp<HomeStackParamList, 'AirdropScreen'>

const AirdropScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()
  const { t } = useTranslation()
  const ring = useSharedValue(0)
  const ringDrop = useSharedValue(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const route = useRoute<Route>()
  const { mint: mintStr } = route.params
  const mint = usePublicKey(mintStr)
  const { symbol, json } = useMetaplexMetadata(mint)

  const onAirdrop = useCallback(async () => {
    if (!currentAccount?.solanaAddress || !anchorProvider) return

    setLoading(true)
    if (mint?.equals(NATIVE_MINT)) {
      solUtils.airdrop(anchorProvider, currentAccount?.solanaAddress)
      setLoading(false)
      navigation.goBack()
    } else {
      try {
        await axios.get(
          `https://faucet.web.test-helium.com/${symbol?.toLowerCase()}/${
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
  }, [anchorProvider, currentAccount?.solanaAddress, mint, navigation, symbol])

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
            <TokenIcon size={160} img={json?.image} />
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
          title={
            !loading
              ? t('airdropScreen.airdropTicker', { ticker: symbol || '' })
              : ''
          }
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
