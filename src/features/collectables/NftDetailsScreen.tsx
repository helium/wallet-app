import React, { useCallback, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ScrollView, LogBox } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import SafeAreaBox from '../../components/SafeAreaBox'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'
import Box from '../../components/Box'
import ImageBox from '../../components/ImageBox'
import ButtonPressable from '../../components/ButtonPressable'
import Text from '../../components/Text'
import { ww } from '../../utils/layout'
import BackScreen from '../../components/BackScreen'
import { useSpacing } from '../../theme/themeHooks'
import Trash from '../../assets/images/trash.svg'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import InfoIcon from '../../assets/images/info.svg'
import { ReAnimatedBox } from '../../components/AnimatedBox'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<CollectableStackParamList, 'NftDetailsScreen'>

const NftDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])

  const { t } = useTranslation()

  const { collectable } = route.params

  const spacing = useSpacing()

  const handleSend = useCallback(() => {
    navigation.navigate('TransferCollectableScreen', {
      collectable,
    })
  }, [collectable, navigation])

  const handleInfoPress = useCallback(() => {
    if (collectable.json) {
      navigation.push('NftMetadataScreen', {
        metadata: collectable.json,
      })
    }
  }, [collectable.json, navigation])

  const backgroundImageUri = useMemo(() => {
    return collectable?.json?.image
  }, [collectable.json])

  if (!collectable.json || !backgroundImageUri) {
    return null
  }

  return (
    <BackScreen
      padding="none"
      title={t('collectablesScreen.nfts.nftDetialTitle')}
      backgroundImageUri={backgroundImageUri}
      edges={backEdges}
      TrailingIcon={InfoIcon}
      onTrailingIconPress={handleInfoPress}
    >
      <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
        <ScrollView>
          <SafeAreaBox
            edges={safeEdges}
            backgroundColor="transparent"
            flex={1}
            padding="m"
            alignItems="center"
          >
            {collectable.json && (
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
                  height={COLLECTABLE_HEIGHT - spacing.xl * 2}
                  width={COLLECTABLE_HEIGHT - spacing.xl * 2}
                  source={{ uri: collectable.json.image, cache: 'force-cache' }}
                  borderRadius="xxl"
                />
              </Box>
            )}
            <Text
              marginTop="l"
              marginBottom="s"
              marginHorizontal="l"
              textAlign="center"
              variant="h1Medium"
            >
              {collectable.json.name}
            </Text>
            <Text variant="body3Medium" color="grey600" marginBottom="xl">
              {collectable.json.description || t('collectables.noDescription')}
            </Text>
            <Box
              flexDirection="row"
              marginBottom="xl"
              marginTop="m"
              marginHorizontal="xl"
            >
              <TouchableOpacityBox
                height={65}
                width={65}
                backgroundColor="transparent10"
                borderRadius="round"
                justifyContent="center"
                alignItems="center"
                marginEnd="s"
              >
                <Trash />
              </TouchableOpacityBox>
              <ButtonPressable
                height={65}
                flexGrow={1}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacity={1}
                backgroundColorOpacityPressed={0.7}
                titleColorDisabled="grey600"
                backgroundColorDisabled="white"
                backgroundColorDisabledOpacity={0.1}
                title={t('collectablesScreen.transfer')}
                titleColor="black"
                onPress={handleSend}
              />
            </Box>
          </SafeAreaBox>
        </ScrollView>
      </ReAnimatedBox>
    </BackScreen>
  )
}

export default NftDetailsScreen
