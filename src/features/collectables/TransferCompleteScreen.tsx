import BackArrow from '@assets/images/backArrow.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import ImageBox from '@components/ImageBox'
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import Text from '@components/Text'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useColors, useSpacing } from '@theme/themeHooks'
import { parseTransactionError } from '@utils/solanaUtils'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogBox } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import 'text-encoding-polyfill'
import ScrollBox from '@components/ScrollBox'
import { NavBarHeight } from '@components/ServiceNavBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WalletNavigationProp } from '@services/WalletService/pages/WalletPage/WalletPageNavigator'
import { RootState } from '../../store/rootReducer'
import { CompressedNFT } from '../../types/solana'
import { ww } from '../../utils/layout'
import { CollectableStackParamList } from './collectablesTypes'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<CollectableStackParamList, 'TransferCompleteScreen'>

const TransferCollectableScreen = () => {
  const route = useRoute<Route>()
  const colors = useColors()
  const spacing = useSpacing()
  const { bottom } = useSafeAreaInsets()
  const navigation = useNavigation<WalletNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const solBalance = useBN(useSolOwnedAmount(useCurrentWallet()).amount)

  const { t } = useTranslation()
  const { collectable } = route.params
  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )

  const asset = useMemo(() => collectable as CompressedNFT, [collectable])
  const assetImage = useMemo(() => {
    return asset?.content?.files?.[0]?.uri
  }, [asset])
  const metadata = useMemo(() => {
    return asset?.content?.metadata
  }, [asset])

  const onReturn = useCallback(() => {
    // Reset Collectables stack to first screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'TokensTabs' }],
    })
  }, [navigation])

  return (
    <ScrollBox>
      <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
        <BackScreen padding="0" headerTopMargin="6xl" edges={[]}>
          <Box
            backgroundColor="transparent"
            flex={1}
            padding="4"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              flexGrow={1}
              marginBottom="8"
              justifyContent="center"
              alignItems="center"
            >
              {metadata && (
                <Box>
                  <ImageBox
                    marginTop="6"
                    backgroundColor={
                      assetImage ? 'primaryBackground' : 'bg.tertiary'
                    }
                    height={COLLECTABLE_HEIGHT - spacing.xl * 5}
                    width={COLLECTABLE_HEIGHT - spacing.xl * 5}
                    source={{ uri: assetImage, cache: 'force-cache' }}
                    borderRadius="4xl"
                  />
                </Box>
              )}
              {solanaPayment &&
                !solanaPayment.error &&
                !solanaPayment.loading && (
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
                      {t('collectablesScreen.transferComplete')}
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
                    variant="displaySmRegular"
                    color="primaryText"
                    marginTop="8"
                    textAlign="center"
                  >
                    {t('collectablesScreen.transferError')}
                  </Text>
                  <Text
                    variant="textSmRegular"
                    color="secondaryText"
                    marginTop="8"
                    numberOfLines={2}
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
                    variant="displaySmRegular"
                    color="primaryText"
                    marginTop="8"
                    textAlign="center"
                  >
                    {t('collectablesScreen.transferError')}
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
                    variant="displaySmRegular"
                    color="primaryText"
                    marginTop="8"
                    textAlign="center"
                  >
                    {t('collectablesScreen.transferingNftTitle')}
                  </Text>
                  <Text
                    variant="textXlRegular"
                    color="secondaryText"
                    textAlign="center"
                    marginBottom="4"
                  >
                    {t('collectablesScreen.transferingNftBody')}
                  </Text>
                  <Box flexDirection="row" marginHorizontal="12">
                    <IndeterminateProgressBar paddingHorizontal="6" />
                  </Box>
                </Animated.View>
              )}
            </Box>
            <Box
              flex={1}
              width="100%"
              justifyContent="flex-end"
              style={{
                paddingBottom: NavBarHeight + bottom + spacing.xl,
              }}
            >
              <ButtonPressable
                marginHorizontal="4"
                height={65}
                borderRadius="full"
                backgroundColor="primaryText"
                backgroundColorOpacityPressed={0.05}
                titleColorPressedOpacity={0.3}
                title={t('collectablesScreen.returnToCollectables')}
                titleColor="primaryBackground"
                onPress={onReturn}
                LeadingComponent={
                  <BackArrow
                    width={16}
                    height={15}
                    color={colors.primaryBackground}
                  />
                }
              />
            </Box>
          </Box>
        </BackScreen>
      </ReAnimatedBox>
    </ScrollBox>
  )
}

export default memo(TransferCollectableScreen)
