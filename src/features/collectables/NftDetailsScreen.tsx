import React, { useCallback, useMemo, memo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import InfoIcon from '@assets/images/info.svg'
import ArrowRight from '@assets/images/arrowRight.svg'
import SafeAreaBox from '@components/SafeAreaBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import globalStyles from '@theme/globalStyles'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import BackScreen from '@components/BackScreen'
import { useSpacing } from '@theme/themeHooks'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { ww } from '../../utils/layout'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import ScrollBox from '@components/ScrollBox'

type Route = RouteProp<CollectableStackParamList, 'NftDetailsScreen'>

const NftDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

  const { t } = useTranslation()

  const { collectable } = route.params
  const { json } = collectable

  const spacing = useSpacing()

  const handleSend = useCallback(() => {
    navigation.navigate('TransferCollectableScreen', {
      collectable,
    })
  }, [collectable, navigation])

  const handleInfoPress = useCallback(() => {
    if (json) {
      navigation.push('NftMetadataScreen', {
        metadata: json,
      })
    }
  }, [navigation, json])

  const backgroundImageUri = useMemo(() => {
    return json?.image
  }, [json])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <ScrollBox>
        <BackScreen
          padding="5"
          title={t('collectablesScreen.nfts.nftDetialTitle')}
          edges={[]}
          TrailingIcon={InfoIcon}
          onTrailingIconPress={handleInfoPress}
          headerTopMargin="6xl"
          headerHorizontalPadding="5"
        >
          <ScrollView>
            <SafeAreaBox
              edges={safeEdges}
              backgroundColor="transparent"
              flex={1}
              alignItems="center"
            >
              {json && (
                <Box>
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
              <Box flexDirection="row" marginBottom="8" marginTop="4">
                {collectable.model === 'nft' && (
                  <ButtonPressable
                    height={65}
                    flexGrow={1}
                    borderRadius="full"
                    backgroundColor="base.white"
                    backgroundColorOpacity={1}
                    backgroundColorOpacityPressed={0.7}
                    titleColorDisabled="gray.600"
                    backgroundColorDisabled="base.white"
                    backgroundColorDisabledOpacity={0.1}
                    title={t('collectablesScreen.transfer')}
                    titleColor="base.black"
                    onPress={handleSend}
                    TrailingComponent={
                      <ArrowRight width={16} height={15} color="black" />
                    }
                  />
                )}
              </Box>
            </SafeAreaBox>
          </ScrollView>
        </BackScreen>
      </ScrollBox>
    </ReAnimatedBox>
  )
}

export default memo(NftDetailsScreen)
