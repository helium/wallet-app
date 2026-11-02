import React from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { BlurView } from 'expo-blur'
import { ChevronRight, Info } from 'lucide-react-native'
import { Image, Platform, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import { withUniwind } from 'uniwind'
import { useContentWidth } from '../../utils/layout'
import BackHeader from './components/BackHeader'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

const SafeArea = withUniwind(TabSafeAreaView)
const Blur = withUniwind(BlurView)
const InfoIcon = withUniwind(Info)
const NextIcon = withUniwind(ChevronRight)

type Route = RouteProp<CollectableStackParamList, 'NftDetailsScreen'>

const NftDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = useContentWidth()

  const { t } = useTranslation()

  const { collectable } = route.params
  const { json } = collectable

  const imageSize = COLLECTABLE_HEIGHT - 64

  const handleSend = () => {
    navigation.navigate('TransferCollectableScreen', {
      collectable,
    })
  }

  const handleInfoPress = () => {
    if (json) {
      navigation.push('NftMetadataScreen', {
        metadata: json,
      })
    }
  }

  const backgroundImageUri = json?.image

  return (
    <Animated.View className="flex-1 bg-background">
      {/* The blurred NFT image fills the screen behind the content. */}
      {backgroundImageUri && (
        <>
          <Image
            className="absolute inset-0 opacity-70"
            source={{ uri: backgroundImageUri, cache: 'force-cache' }}
            resizeMode="cover"
          />
          <Blur
            className="absolute inset-0"
            intensity={Platform.OS === 'android' ? 15 : 5}
          />
        </>
      )}
      <SafeArea edges={['top']} className="flex-1">
        <View className="mt-6">
          <BackHeader title={t('collectablesScreen.nfts.nftDetialTitle')} />
          <PressableScale
            onPress={handleInfoPress}
            hitSlop={24}
            feedback="opacity"
            accessibilityLabel={t('collectablesScreen.metadata')}
            className="absolute bottom-0 right-6 top-0 justify-center"
          >
            <InfoIcon size={24} colorClassName="accent-foreground" />
          </PressableScale>
        </View>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <SafeArea edges={['bottom']} className="flex-1 items-center p-4">
            {json && (
              <View className="shadow-lg">
                <Image
                  className={twMerge(
                    'mt-6 rounded-[35px]',
                    json.image ? 'bg-primary' : 'bg-secondary',
                  )}
                  style={{ height: imageSize, width: imageSize }}
                  source={{ uri: json.image, cache: 'force-cache' }}
                />
              </View>
            )}
            <Text size="4xl" className="mx-6 mb-2 mt-6 text-center font-medium">
              {json?.name}
            </Text>
            <Text
              size="xs"
              className="mb-8 text-center font-medium text-muted-foreground"
            >
              {json?.description || t('collectables.noDescription')}
            </Text>
            <View className="mx-8 mb-8 mt-4 flex-row">
              {collectable.model === 'nft' && (
                <Button
                  variant="cta"
                  size="lg"
                  className="flex-1"
                  onPress={handleSend}
                >
                  <Text className={buttonTextVariants({ variant: 'cta' })}>
                    {t('collectablesScreen.transfer')}
                  </Text>
                  <NextIcon size={16} colorClassName="accent-white" />
                </Button>
              )}
            </View>
          </SafeArea>
        </ScrollView>
      </SafeArea>
    </Animated.View>
  )
}

export default NftDetailsScreen
