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

type Route = RouteProp<CollectableStackParamList, 'NftDetailsScreen'>

const NftDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])

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
      <BackScreen
        padding="0"
        title={t('collectablesScreen.nfts.nftDetialTitle')}
        backgroundImageUri={backgroundImageUri}
        edges={backEdges}
        TrailingIcon={InfoIcon}
        onTrailingIconPress={handleInfoPress}
        headerTopMargin="6"
      >
        <ScrollView>
          <SafeAreaBox
            edges={safeEdges}
            backgroundColor="transparent"
            flex={1}
            padding="4"
            alignItems="center"
          >
            {json && (
              <Box
                shadowColor="base.black"
                shadowOpacity={0.4}
                shadowOffset={{ width: 0, height: 10 }}
                shadowRadius={10}
                elevation={12}
              >
                <ImageBox
                  marginTop="6"
                  backgroundColor={
                    json.image ? 'primaryBackground' : 'bg.tertiary'
                  }
                  height={COLLECTABLE_HEIGHT - spacing.xl * 2}
                  width={COLLECTABLE_HEIGHT - spacing.xl * 2}
                  source={{ uri: json.image, cache: 'force-cache' }}
                  borderRadius="4xl"
                />
              </Box>
            )}
            <Text
              marginTop="6"
              marginBottom="2"
              marginHorizontal="6"
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
            <Box
              flexDirection="row"
              marginBottom="8"
              marginTop="4"
              marginHorizontal="8"
            >
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
    </ReAnimatedBox>
  )
}

export default memo(NftDetailsScreen)
