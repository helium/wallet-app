import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { parseTransactionError } from '@utils/solanaUtils'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import 'text-encoding-polyfill'
import ArrowRight from '../../assets/images/arrowRight.svg'
import BackArrow from '../../assets/images/backArrow.svg'
import { TabBarNavigationProp } from '../../navigation/rootTypes'
import { RootState } from '../../store/rootReducer'
import { SwapStackParamList } from './swapTypes'

type Route = RouteProp<SwapStackParamList, 'SwappingScreen'>

const SwappingScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<TabBarNavigationProp>()
  const backEdges = useMemo(() => ['bottom'] as Edge[], [])
  const solBalance = useBN(useSolOwnedAmount(useCurrentWallet()).amount)

  const { t } = useTranslation()
  const { tokenA, tokenB } = route.params
  const { json: jsonA } = useMetaplexMetadata(usePublicKey(tokenA))
  const { json: jsonB } = useMetaplexMetadata(usePublicKey(tokenB))

  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )

  const onReturn = useCallback(() => {
    // Reset Swap stack to first screen
    navigation.goBack()
  }, [navigation])

  const TokensSwappedContainer = useMemo(() => {
    return (
      <Box flexDirection="row" alignItems="center">
        <Box
          backgroundColor="black"
          borderRadius="round"
          padding="s"
          marginEnd="m"
        >
          <TokenIcon img={jsonA?.image} size={50} />
        </Box>
        <ArrowRight color="white" height={24} width={26.5} />
        <Box
          marginStart="m"
          backgroundColor="black"
          borderRadius="round"
          padding="s"
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
        padding="none"
        edges={backEdges}
        onClose={onReturn}
        hideBack
        headerTopMargin="l"
        paddingHorizontal="l"
      >
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          {TokensSwappedContainer}
          {solanaPayment && !solanaPayment.error && !solanaPayment.loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text variant="h2" color="white" marginTop="xl">
                {t('swapsScreen.swapComplete')}
              </Text>
              <Text
                variant="body1"
                color="secondaryText"
                marginTop="xl"
                textAlign="center"
              >
                {t('swapsScreen.swapCompleteBody')}
              </Text>
            </Animated.View>
          )}

          {solanaPayment?.error && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h2"
                color="white"
                marginTop="xl"
                textAlign="center"
              >
                {t('swapsScreen.swapError')}
              </Text>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="xl"
                textAlign="center"
              >
                {parseTransactionError(
                  solBalance,
                  solanaPayment?.error?.message,
                )}
              </Text>
            </Animated.View>
          )}

          {!solanaPayment && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h2"
                color="white"
                marginTop="xl"
                textAlign="center"
              >
                {t('swapsScreen.swapError')}
              </Text>
            </Animated.View>
          )}

          {solanaPayment && solanaPayment.loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h2"
                color="white"
                marginTop="xl"
                textAlign="center"
              >
                {t('swapsScreen.swappingTokens')}
              </Text>
              <Text
                marginTop="m"
                variant="body0"
                color="grey600"
                textAlign="center"
              >
                {t('swapsScreen.swappingTokensBody')}
              </Text>
              <Box marginTop="xl" flexDirection="row" marginHorizontal="l">
                <IndeterminateProgressBar paddingHorizontal="l" />
              </Box>
            </Animated.View>
          )}
        </Box>
        <Box width="100%" justifyContent="flex-end" paddingTop="l">
          <ButtonPressable
            marginHorizontal="m"
            marginBottom="xl"
            height={65}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacity={0.1}
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            title={t('swapsScreen.returnToSwaps')}
            titleColor="white"
            onPress={onReturn}
            LeadingComponent={
              <BackArrow width={16} height={15} color="white" />
            }
          />
        </Box>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(SwappingScreen)
