import React, { useCallback, useMemo, memo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { LogBox } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import BackArrow from '@assets/images/backArrow.svg'
import IndeterminateProgressBar from '../../components/IndeterminateProgressBar'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { DelayedFadeIn } from '../../components/FadeInOut'
import Box from '../../components/Box'
import ImageBox from '../../components/ImageBox'
import ButtonPressable from '../../components/ButtonPressable'
import Text from '../../components/Text'
import { ww } from '../../utils/layout'
import BackScreen from '../../components/BackScreen'
import { useSpacing } from '../../theme/themeHooks'
import { RootState } from '../../store/rootReducer'
import { ReAnimatedBox } from '../../components/AnimatedBox'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<CollectableStackParamList, 'TransferCompleteScreen'>

const TransferCollectableScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const backEdges = useMemo(() => ['top'] as Edge[], [])

  const { t } = useTranslation()
  const { collectable } = route.params
  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )
  const spacing = useSpacing()
  const {
    content: { metadata },
  } = collectable

  const backgroundImageUri = useMemo(() => {
    return metadata?.image
  }, [metadata.image])

  const onReturn = useCallback(() => {
    navigation.popToTop()
  }, [navigation])

  if (!metadata || !backgroundImageUri) {
    return null
  }

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <BackScreen
        padding="none"
        backgroundImageUri={backgroundImageUri}
        edges={backEdges}
        onClose={onReturn}
        hideBack
        headerTopMargin="l"
      >
        <Box
          backgroundColor="transparent"
          flex={1}
          padding="m"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            flexGrow={1}
            marginBottom="xl"
            justifyContent="center"
            alignItems="center"
          >
            {metadata && (
              <Box
                shadowColor="black"
                shadowOpacity={0.4}
                shadowOffset={{ width: 0, height: 10 }}
                shadowRadius={10}
                elevation={12}
              >
                <ImageBox
                  marginTop="l"
                  backgroundColor="black"
                  height={COLLECTABLE_HEIGHT - spacing.xl * 5}
                  width={COLLECTABLE_HEIGHT - spacing.xl * 5}
                  source={{ uri: metadata.image, cache: 'force-cache' }}
                  borderRadius="xxl"
                />
              </Box>
            )}
            {solanaPayment && !solanaPayment.error && !solanaPayment.loading && (
              <Animated.View
                style={{ alignItems: 'center' }}
                entering={FadeIn}
                exiting={FadeOut}
              >
                <Text variant="h2" color="white" marginTop="xl">
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
                  variant="h2"
                  color="white"
                  marginTop="xl"
                  textAlign="center"
                >
                  {t('collectablesScreen.transferError')}
                </Text>
                <Text
                  variant="body2"
                  color="secondaryText"
                  marginTop="xl"
                  numberOfLines={2}
                  textAlign="center"
                >
                  {solanaPayment.error.message}
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
                  variant="h2"
                  color="white"
                  marginTop="xl"
                  textAlign="center"
                >
                  {t('collectablesScreen.transferingNftTitle')}
                </Text>
                <Text
                  variant="body0"
                  color="grey600"
                  textAlign="center"
                  marginBottom="m"
                >
                  {t('collectablesScreen.transferingNftBody')}
                </Text>
                <Box flexDirection="row" marginHorizontal="xxl">
                  <IndeterminateProgressBar paddingHorizontal="l" />
                </Box>
              </Animated.View>
            )}
          </Box>
          <Box flex={1} width="100%" justifyContent="flex-end">
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
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(TransferCollectableScreen)
