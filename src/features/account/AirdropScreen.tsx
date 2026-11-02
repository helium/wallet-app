import DripLogo from '@assets/images/dripLogo.svg'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import * as logger from '@utils/logger'
import * as solUtils from '@utils/solanaUtils'
import axios from 'axios'
import { ChevronLeft } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import { useSolana } from '../../solana/SolanaProvider'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'

const SafeArea = withUniwind(TabSafeAreaView)
const BackIcon = withUniwind(ChevronLeft)

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

  const solanaAddress = currentAccount?.solanaAddress

  const onAirdrop = async () => {
    if (!solanaAddress || !anchorProvider) return

    setLoading(true)
    if (mint?.equals(NATIVE_MINT)) {
      void solUtils.airdrop(anchorProvider, solanaAddress)
      setLoading(false)
      navigation.goBack()
    } else {
      try {
        await axios.get(
          `https://faucet.web.test-helium.com/${symbol?.toLowerCase()}/${solanaAddress}?amount=2)`,
        )

        setLoading(false)
        navigation.goBack()
      } catch (error) {
        setLoading(false)
        logger.error(error)
        setErrorMessage((error as Error).message)
      }
    }
  }

  const onAnimationDropComplete = () => {
    ring.set(1)
  }

  const onAnimationComplete = () => {
    ringDrop.set(1)
    ring.set(0)
  }

  const ringStyle = useAnimatedStyle(() => {
    let ringVal = ring.get()

    if (ring.get() === 1) {
      ringVal = withRepeat(
        withTiming(
          ring.get(),
          {
            duration: 2000,
          },
          () => scheduleOnRN(onAnimationComplete),
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
    if (ringDrop.get() === 1) {
      ringDropVal = withRepeat(
        withDelay(
          2000,
          withTiming(
            800,
            {
              duration: 2000,
            },
            () => scheduleOnRN(onAnimationDropComplete),
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
    ring.set(1)

    return () => {
      cancelAnimation(ring)
      cancelAnimation(ringDrop)
    }
  }, [ring, ringDrop])

  return (
    <SafeArea edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="items-start px-6 pb-4 pt-3">
        <PressableScale
          onPress={navigation.goBack}
          hitSlop={24}
          feedback="opacity"
          className="flex-row items-center gap-1"
        >
          <BackIcon size={16} colorClassName="accent-muted-foreground" />
          <Text className="text-muted-foreground">{t('generic.back')}</Text>
        </PressableScale>
      </View>
      <View>
        <Text size="xl" className="mt-6 text-center">
          {t('airdropScreen.title')}
        </Text>
        <Text size="base" className="mt-4 text-center text-muted-foreground">
          {t('airdropScreen.subtitle')}
        </Text>
      </View>
      <View className="mb-6 flex-1 items-center justify-center">
        <View className="items-center justify-center">
          <TokenIcon size={160} img={json?.image} />
          <View className="absolute top-[120px]">
            <Animated.View style={[ringStyle, dropStyle]}>
              <DripLogo />
            </Animated.View>
          </View>
        </View>
      </View>
      <Text size="base" className="mt-4 text-center text-destructive">
        {errorMessage ? t('airdropScreen.error') : ''}
      </Text>
      <Button
        variant="cta"
        size="dashboard"
        className="mx-6 my-6"
        disabled={loading}
        onPress={() => void onAirdrop().catch(console.error)}
      >
        {loading ? (
          <Spinner size="small" colorClassName="accent-white" />
        ) : (
          t('airdropScreen.airdropTicker', { ticker: symbol || '' })
        )}
      </Button>
    </SafeArea>
  )
}

export default AirdropScreen
