import BackArrow from '@assets/images/backArrow.svg'
import AccountIcon from '@components/AccountIcon'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import FadeInOut, { DelayedFadeIn } from '@components/FadeInOut'
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import ProgressBar from '@components/ProgressBar'
import Text from '@components/Text'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { toNumber } from '@helium/spl-utils'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useHotspots from '@hooks/useHotspots'
import { useNavigation } from '@react-navigation/native'
import globalStyles from '@theme/globalStyles'
import { parseTransactionError } from '@utils/solanaUtils'
import LottieView from 'lottie-react-native'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import 'text-encoding-polyfill'
import { TabBarNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { RootState } from '../../store/rootReducer'
import iotMobileTokens from './animations/iot-mobile-tokens.json'
import iotTokens from './animations/iot-tokens.json'
import mobileTokens from './animations/mobile-tokens.json'

const ClaimingRewardsScreen = () => {
  const { currentAccount } = useAccountStorage()
  const navigation = useNavigation<TabBarNavigationProp>()
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const { bottom } = useSafeAreaInsets()
  const { t } = useTranslation()
  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )
  const { pendingIotRewards, pendingMobileRewards } = useHotspots()
  const pendingIotRewardsNum = pendingIotRewards
    ? toNumber(pendingIotRewards, 6)
    : 0
  const pendingMobileRewardsNum = pendingMobileRewards
    ? toNumber(pendingMobileRewards, 6)
    : 0

  const video =
    pendingIotRewardsNum && pendingMobileRewardsNum
      ? iotMobileTokens
      : pendingMobileRewardsNum
      ? mobileTokens
      : iotTokens

  const onReturn = useCallback(() => {
    // Reset Collectables stack to first screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Collectables' }],
    })
  }, [navigation])

  // Don't start the video until the screen has been up for 500ms
  const [videoEnded, setVideoEnded] = useState(false)
  const animationRef = useRef<LottieView>(null)

  useEffect(() => {
    const delay = setTimeout(() => {
      animationRef.current?.play()
    }, 800) // 1000 milliseconds delay
    return () => clearTimeout(delay)
  }, [animationRef])

  if (!currentAccount) {
    return null
  }

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1} backgroundColor="black">
      <Box
        backgroundColor="transparent"
        flex={1}
        alignItems="center"
        justifyContent="center"
      >
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Box
            padding="m"
            shadowColor="black"
            shadowOpacity={0.4}
            shadowOffset={{ width: 0, height: 10 }}
            shadowRadius={10}
            elevation={12}
          >
            <AccountIcon address={currentAccount?.solanaAddress} size={76} />
          </Box>
          {solanaPayment && !solanaPayment.error && !solanaPayment.loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text variant="h1Medium" color="white" marginTop="xl">
                {t('collectablesScreen.claimComplete')}
              </Text>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="xl"
                numberOfLines={2}
                textAlign="center"
              >
                {t('collectablesScreen.claimCompleteBody')}
              </Text>
            </Animated.View>
          )}

          {solanaPayment?.error ? (
            <Animated.View
              style={{
                alignItems: 'center',
              }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Box padding="m">
                <Text variant="h2Medium" color="white" textAlign="center">
                  {t('collectablesScreen.rewardsError')}
                </Text>
                <Text
                  variant="body2"
                  color="secondaryText"
                  marginTop="m"
                  numberOfLines={2}
                  textAlign="center"
                >
                  {parseTransactionError(
                    solBalance,
                    solanaPayment?.error?.message,
                  )}
                </Text>
              </Box>
            </Animated.View>
          ) : null}

          {!solanaPayment ? (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Box padding="m">
                <Text
                  textAlign="center"
                  variant="h1Medium"
                  color="white"
                  marginTop="xl"
                >
                  {t('collectablesScreen.rewardsError')}
                </Text>
              </Box>
            </Animated.View>
          ) : null}

          {solanaPayment && solanaPayment.loading ? (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Box paddingHorizontal="m" mb="m">
                <Text variant="h2Medium" color="white" textAlign="center">
                  {t('collectablesScreen.claimingRewards')}
                </Text>
                <Text
                  variant="body1"
                  color="grey50"
                  textAlign="center"
                  marginTop="s"
                >
                  {t('collectablesScreen.claimingRewardsBody')}
                </Text>
              </Box>

              {videoEnded ? (
                <Box
                  height={240}
                  flexDirection="row"
                  marginHorizontal="xxl"
                  marginTop="m"
                >
                  {typeof solanaPayment.progress !== 'undefined' ? (
                    <Box
                      width="100%"
                      flexDirection="column"
                      alignContent="stretch"
                      alignItems="stretch"
                    >
                      <ProgressBar progress={solanaPayment.progress.percent} />
                      <Text
                        textAlign="center"
                        variant="body2"
                        color="secondaryText"
                        marginTop="s"
                        numberOfLines={2}
                      >
                        {solanaPayment.progress.text}
                      </Text>
                    </Box>
                  ) : (
                    <IndeterminateProgressBar paddingHorizontal="l" />
                  )}
                </Box>
              ) : (
                <Box
                  style={{ marginBottom: -40 }}
                  width="100%"
                  aspectRatio={1.4}
                  height={240}
                >
                  <FadeInOut style={globalStyles.container}>
                    <LottieView
                      ref={animationRef}
                      source={video}
                      loop={false}
                      style={{ width: '100%', height: '100%' }}
                      onAnimationFinish={() => {
                        setVideoEnded(true)
                      }}
                    />
                  </FadeInOut>
                </Box>
              )}
            </Animated.View>
          ) : null}
        </Box>
        <Box
          width="100%"
          justifyContent="flex-end"
          style={{ marginBottom: bottom }}
        >
          <ButtonPressable
            marginHorizontal="m"
            marginBottom="m"
            height={65}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacity={0.1}
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            title={t('collectablesScreen.returnToCollectables')}
            titleColor="white"
            onPress={onReturn}
            LeadingComponent={
              <BackArrow width={16} height={15} color="white" />
            }
          />
        </Box>
      </Box>
    </ReAnimatedBox>
  )
}

export default memo(ClaimingRewardsScreen)
