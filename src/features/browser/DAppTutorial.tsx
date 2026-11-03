import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageSourcePropType, StyleSheet, View } from 'react-native'
import { Image } from '@ui/Image'
import { useSharedValue } from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import { Carousel, Pagination } from 'react-native-reanimated-carousel'
import { useResolveClassNames, withUniwind } from 'uniwind'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useContentWidth } from '@utils/layout'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { BrowserNavigationProp } from './browserTypes'
import { useSolana } from '../../solana/SolanaProvider'

const SafeArea = withUniwind(TabSafeAreaView)

const EDGES: Edge[] = ['top', 'bottom']

type CarouselItem = {
  titleKey: string
  bodyKey: string
  image: ImageSourcePropType
  // Classes that pull the title up under the image
  imageVerticalOffset?: string
}
const slides: Array<CarouselItem> = [
  {
    titleKey: 'defiTutorial.slides.0.title',
    bodyKey: 'defiTutorial.slides.0.body',
    image: require('@assets/images/defiSlide1.png'),
    imageVerticalOffset: '-mt-12',
  },
  {
    titleKey: 'defiTutorial.slides.1.title',
    bodyKey: 'defiTutorial.slides.1.body',
    image: require('@assets/images/defiSlide2.png'),
    imageVerticalOffset: '-mt-12',
  },
  {
    titleKey: 'defiTutorial.slides.2.title',
    bodyKey: 'defiTutorial.slides.2.body',
    image: require('@assets/images/defiSlide3.png'),
    imageVerticalOffset: '-mt-12',
  },
  {
    titleKey: 'defiTutorial.slides.3.title',
    bodyKey: 'defiTutorial.slides.3.body',
    image: require('@assets/images/defiSlide4.png'),
    imageVerticalOffset: '-mt-12',
  },
]
const DAppTutorial = () => {
  const { t } = useTranslation()
  const progress = useSharedValue(0)
  const [viewedSlides, setViewedSlides] = useState(false)
  const { backgroundColor: dotColour } = useResolveClassNames('bg-foreground')
  const contentWidth = useContentWidth()
  const navigation = useNavigation<BrowserNavigationProp>()
  const { setDAppTutorialCompleted } = useAppStorage()
  const { cluster } = useSolana()

  const handleEnterDAppPressed = () => {
    void setDAppTutorialCompleted(cluster)
    navigation.replace('BrowserScreen')
  }

  const onSnapToItem = (index: number) => {
    if (index === slides.length - 1) {
      setViewedSlides(true)
    }
  }

  const renderCarouselItem = ({ item }: { item: CarouselItem }) => {
    return (
      <View className="flex-1 justify-center">
        <Image
          className="shrink self-center"
          source={item.image}
          contentFit="contain"
          style={{ width: Math.round(contentWidth * 0.5) }}
        />
        <Text size="4xl" className={`text-center ${item.imageVerticalOffset}`}>
          {t(item.titleKey)}
        </Text>
        <Text size="base" className="mt-4 text-center text-muted-foreground">
          {t(item.bodyKey)}
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <SafeArea className="flex-1" edges={EDGES}>
        <View className="bg-background pt-12 pb-8">
          <Text size="xl" className="text-center">
            {t('defiTutorial.title')}
          </Text>
        </View>
        <Carousel
          style={[styles.carousel, { width: Math.round(contentWidth * 0.9) }]}
          contentContainerStyle={styles.carouselContent}
          data={slides}
          renderItem={renderCarouselItem}
          progress={progress}
          onSnapToItem={onSnapToItem}
        />
        <View>
          <Pagination
            count={slides.length}
            progress={progress}
            dotStyle={{ ...styles.dot, backgroundColor: dotColour }}
            activeDotStyle={{
              ...styles.activeDot,
              backgroundColor: dotColour,
            }}
            containerStyle={styles.pagination}
          />

          <Button
            variant="cta"
            size="dashboard"
            className="mx-6 mb-6"
            onPress={handleEnterDAppPressed}
            disabled={!viewedSlides}
          >
            {t('defiTutorial.enterDApps')}
          </Button>
        </View>
      </SafeArea>
    </View>
  )
}

const styles = StyleSheet.create({
  carousel: {
    flex: 1,
    alignSelf: 'center',
    overflow: 'visible',
  },
  carouselContent: { overflow: 'visible' },
  dot: { width: 6, height: 6, borderRadius: 3, opacity: 0.4 },
  activeDot: { opacity: 1 },
  pagination: { paddingVertical: 30, justifyContent: 'center', gap: 16 },
})

export default DAppTutorial
