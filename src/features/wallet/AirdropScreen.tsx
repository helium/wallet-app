import DripLogo from '@assets/svgs/dripLogo.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import * as logger from '@utils/logger'
import * as solUtils from '@utils/solanaUtils'
import axios from 'axios'
import React, { memo, useCallback, useEffect, useState } from 'react'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ScrollBox from '@components/ScrollBox'
import HNT from '@assets/svgs/hnt.svg'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { NavBarHeight } from '@components/ServiceNavBar'
import {
  WalletNavigationProp,
  WalletStackParamList,
} from 'src/app/services/WalletService/pages/WalletPage'
import { useSolana } from '@features/solana/SolanaProvider'

const DROP_HEIGHT = 79

type Route = RouteProp<WalletStackParamList, 'AirdropScreen'>

const AirdropScreen = () => {
  const navigation = useNavigation<WalletNavigationProp>()
  const { bottom } = useSafeAreaInsets()
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
  const { symbol } = useMetaplexMetadata(mint)

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
    <ScrollBox contentContainerStyle={{ flex: 1 }}>
      <BackScreen flex={1} padding="0">
        <Box flex={1}>
          <Box>
            <Text variant="textXlRegular" textAlign="center" marginTop="6">
              {t('airdropScreen.title')}
            </Text>
            <Text
              variant="textMdRegular"
              textAlign="center"
              color="secondaryText"
              marginTop="4"
            >
              {t('airdropScreen.subtitle')}
            </Text>
          </Box>
          <Box
            flex={1}
            justifyContent="center"
            alignItems="center"
            marginBottom="6"
          >
            <Box justifyContent="center" alignItems="center" marginTop="6xl">
              <Box>
                <HNT width={160} height={160} color="red" />
              </Box>
              <Box position="absolute" top={120}>
                <ReAnimatedBox style={[ringStyle, dropStyle]}>
                  <DripLogo />
                </ReAnimatedBox>
              </Box>
            </Box>
          </Box>
          <Text
            variant="textMdRegular"
            textAlign="center"
            color="error.500"
            marginTop="4"
          >
            {errorMessage ? t('airdropScreen.error') : ''}
          </Text>
          <ButtonPressable
            style={{
              marginBottom: NavBarHeight + bottom,
            }}
            borderRadius="full"
            onPress={onAirdrop}
            backgroundColor="primaryText"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="bg.tertiary"
            backgroundColorDisabledOpacity={0.5}
            titleColorDisabled="gray.800"
            titleColor="primaryBackground"
            title={
              !loading
                ? t('airdropScreen.airdropTicker', { ticker: symbol || '' })
                : ''
            }
            disabled={loading}
            marginHorizontal="6"
            LeadingComponent={
              loading && <CircleLoader loaderSize={20} color="primaryText" />
            }
          />
        </Box>
      </BackScreen>
    </ScrollBox>
  )
}

export default memo(AirdropScreen)
