import React, { useCallback, useMemo, memo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import InfoIcon from '@assets/images/info.svg'
import ArrowRight from '@assets/images/arrowRight.svg'
import { DelayedFadeIn } from '@components/FadeInOut'
import globalStyles from '@theme/globalStyles'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import BackScreen from '@components/BackScreen'
import { useColors, useSpacing } from '@theme/themeHooks'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { ww } from '../../utils/layout'
import ScrollBox from '@components/ScrollBox'
import {
  WalletNavigationProp,
  WalletStackParamList,
} from '@services/WalletService/pages/WalletPage/WalletPageNavigator'
import { Collectable } from '@types/solana'
import { NavBarHeight } from '@components/ServiceNavBar'
import NftMetadata from './NftMetadata'

type Route = RouteProp<WalletStackParamList, 'NftDetailsScreen'>

const NftDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<WalletNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const { bottom } = useSafeAreaInsets()
  const colors = useColors()

  const { t } = useTranslation()

  const { collectable }: { collectable: Collectable } = route.params
  const { json } = collectable

  const spacing = useSpacing()

  const handleSend = useCallback(() => {
    navigation.navigate('TransferCollectableScreen', {
      collectable,
    })
  }, [collectable, navigation])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <ScrollBox>
        <BackScreen
          padding="5"
          title={t('collectablesScreen.nfts.nftDetialTitle')}
          edges={[]}
          headerTopMargin="6xl"
          headerHorizontalPadding="5"
        >
          <ScrollView>
            <Box flex={1}>
              {json && (
                <Box alignItems="center">
                  <ImageBox
                    marginTop="6"
                    backgroundColor={
                      json.image ? 'primaryBackground' : 'bg.tertiary'
                    }
                    height={COLLECTABLE_HEIGHT - spacing['6'] * 2}
                    width={COLLECTABLE_HEIGHT - spacing['6'] * 2}
                    source={{ uri: json.image, cache: 'force-cache' }}
                    borderRadius="4xl"
                  />
                </Box>
              )}
              <Text
                marginTop="6"
                marginBottom="2"
                textAlign="center"
                variant="displayMdMedium"
              >
                {json?.name}
              </Text>
              <Text
                variant="textXsMedium"
                color="gray.600"
                marginBottom="8"
                textAlign="center"
              >
                {json?.description || t('collectables.noDescription')}
              </Text>
              <Box flexDirection="row">
                {collectable?.content?.metadata?.token_standard ===
                  'ProgrammableNonFungible' && (
                  <ButtonPressable
                    height={65}
                    flexGrow={1}
                    borderRadius="full"
                    backgroundColor="primaryText"
                    backgroundColorOpacity={1}
                    backgroundColorOpacityPressed={0.7}
                    title={t('collectablesScreen.transfer')}
                    titleColor="primaryBackground"
                    onPress={handleSend}
                    TrailingComponent={
                      <ArrowRight
                        width={16}
                        height={15}
                        color={colors.primaryBackground}
                      />
                    }
                  />
                )}
              </Box>
              <Box
                flex={1}
                marginTop="2xl"
                style={{ marginBottom: NavBarHeight + bottom }}
              >
                <NftMetadata metadata={json} />
              </Box>
            </Box>
          </ScrollView>
        </BackScreen>
      </ScrollBox>
    </ReAnimatedBox>
  )
}

export default memo(NftDetailsScreen)
