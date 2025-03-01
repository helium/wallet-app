import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import { useDFlow } from '@config/storage/DFlowProvider'
import { useConnection } from '@solana/wallet-adapter-react'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import ArrowRight from '@assets/svgs/arrowRight.svg'
import BackArrow from '@assets/svgs/backArrow.svg'
import { TabBarNavigationProp } from '@app/rootTypes'
import { ORDER_STATUS } from '@dflow-protocol/swap-api-utils'
import * as Logger from '@utils/logger'
import { SwapStackParamList } from './swapTypes'

type Route = RouteProp<SwapStackParamList, 'SwappingScreen'>

const SwappingScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<TabBarNavigationProp>()
  const backEdges = useMemo(() => ['bottom'] as Edge[], [])
  const { t } = useTranslation()
  const {
    tokenA,
    tokenB,
    intent,
    signedOpenTransaction,
    submitIntentResponse,
  } = route.params
  const { json: jsonA } = useMetaplexMetadata(usePublicKey(tokenA))
  const { json: jsonB } = useMetaplexMetadata(usePublicKey(tokenB))
  const { connection } = useConnection()
  const { monitorOrder } = useDFlow()
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const monitor = async () => {
      try {
        const result = await monitorOrder({
          connection,
          intent,
          signedOpenTransaction,
          submitIntentResponse,
        })

        switch (result.status) {
          case ORDER_STATUS.CLOSED: {
            if (result.fills.length > 0) {
              setSuccess(true)
              setTimeout(() => navigation.goBack(), 2000)
            } else {
              setError(t('swapsScreen.swapFailed'))
            }
            break
          }
          case ORDER_STATUS.PENDING_CLOSE: {
            if (result.fills.length > 0) {
              setSuccess(true)
              setTimeout(() => navigation.goBack(), 2000)
            } else {
              setError(t('swapsScreen.swapFailed'))
            }
            break
          }
          case ORDER_STATUS.OPEN_EXPIRED: {
            setError(t('swapsScreen.swapExpired'))
            break
          }
          case ORDER_STATUS.OPEN_FAILED: {
            setError(
              (result.transactionError as string) ||
                t('swapsScreen.swapFailed'),
            )
            break
          }
        }
      } catch (e) {
        Logger.error(e)
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    monitor()
  }, [
    connection,
    monitorOrder,
    navigation,
    intent,
    signedOpenTransaction,
    submitIntentResponse,
    t,
  ])

  const onReturn = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const TokensSwappedContainer = useMemo(() => {
    return (
      <Box flexDirection="row" alignItems="center">
        <Box
          backgroundColor="base.black"
          borderRadius="full"
          padding="2"
          marginEnd="4"
        >
          <TokenIcon img={jsonA?.image} size={50} />
        </Box>
        <ArrowRight color="primaryText" height={24} width={26.5} />
        <Box
          marginStart="4"
          backgroundColor="base.black"
          borderRadius="full"
          padding="2"
        >
          <TokenIcon img={jsonB?.image} size={50} />
        </Box>
      </Box>
    )
  }, [jsonA?.image, jsonB?.image])

  return (
    <ReAnimatedBox
      entering={DelayedFadeIn}
      flex={1}
      backgroundColor="secondaryBackground"
    >
      <BackScreen
        padding="0"
        edges={backEdges}
        onClose={onReturn}
        hideBack
        headerTopMargin="6"
        paddingHorizontal="6"
      >
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          {TokensSwappedContainer}
          {success && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="displaySmRegular"
                color="primaryText"
                marginTop="8"
              >
                {t('swapsScreen.swapComplete')}
              </Text>
              <Text
                variant="textMdRegular"
                color="secondaryText"
                marginTop="8"
                textAlign="center"
              >
                {t('swapsScreen.swapCompleteBody')}
              </Text>
            </Animated.View>
          )}

          {error && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="displaySmRegular"
                color="primaryText"
                marginTop="8"
                textAlign="center"
              >
                {t('swapsScreen.swapError')}
              </Text>
              <Text
                variant="textSmRegular"
                color="secondaryText"
                marginTop="8"
                textAlign="center"
              >
                {error}
              </Text>
            </Animated.View>
          )}

          {loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="displaySmRegular"
                color="primaryText"
                marginTop="8"
                textAlign="center"
              >
                {t('swapsScreen.swappingTokens')}
              </Text>
              <Text
                marginTop="4"
                variant="textXlRegular"
                color="secondaryText"
                textAlign="center"
              >
                {t('swapsScreen.swappingTokensBody')}
              </Text>
              <Box marginTop="8" flexDirection="row" marginHorizontal="6">
                <IndeterminateProgressBar paddingHorizontal="6" />
              </Box>
            </Animated.View>
          )}
        </Box>
        <Box width="100%" justifyContent="flex-end" paddingTop="6">
          <ButtonPressable
            marginHorizontal="4"
            marginBottom="8"
            height={65}
            borderRadius="full"
            backgroundColor="base.white"
            backgroundColorOpacity={0.1}
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            title={t('swapsScreen.returnToSwaps')}
            titleColor="base.white"
            onPress={onReturn}
            LeadingComponent={
              <BackArrow width={16} height={15} color="primaryText" />
            }
          />
        </Box>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(SwappingScreen)
