import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import { Carousel, Pagination } from 'react-native-reanimated-carousel'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextTransform from '@components/TextTransform'
import { useAppStorage } from '@storage/AppStorageProvider'
import { Spacing } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import { wp } from '@utils/layout'
import ButtonPressable from '@components/ButtonPressable'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import { BrowserNavigationProp } from './browserTypes'
import { useSolana } from '../../solana/SolanaProvider'

type CarouselItem = {
  titleKey: string
  bodyKey: string
  image: Element
  imageVerticalOffset?: Spacing
}
const slides: Array<CarouselItem> = [
  {
    titleKey: 'defiTutorial.slides.0.title',
    bodyKey: 'defiTutorial.slides.0.body',
    image: require('@assets/images/defiSlide1.png'),
    imageVerticalOffset: 'n_xxl',
  },
  {
    titleKey: 'defiTutorial.slides.1.title',
    bodyKey: 'defiTutorial.slides.1.body',
    image: require('@assets/images/defiSlide2.png'),
    imageVerticalOffset: 'n_xxl',
  },
  {
    titleKey: 'defiTutorial.slides.2.title',
    bodyKey: 'defiTutorial.slides.2.body',
    image: require('@assets/images/defiSlide3.png'),
    imageVerticalOffset: 'n_xxl',
  },
  {
    titleKey: 'defiTutorial.slides.3.title',
    bodyKey: 'defiTutorial.slides.3.body',
    image: require('@assets/images/defiSlide4.png'),
    imageVerticalOffset: 'n_xxl',
  },
]
const DAppTutorial = () => {
  const { t } = useTranslation()
  const progress = useSharedValue(0)
  const [viewedSlides, setViewedSlides] = useState(false)
  const colors = useColors()
  const navigation = useNavigation<BrowserNavigationProp>()
  const { setDAppTutorialCompleted } = useAppStorage()
  const { cluster } = useSolana()
  const edges = useMemo((): Edge[] => ['top'], [])

  const handleEnterDAppPressed = useCallback(() => {
    setDAppTutorialCompleted(cluster)
    navigation.replace('BrowserScreen')
  }, [navigation, setDAppTutorialCompleted, cluster])

  const onSnapToItem = useCallback((index: number) => {
    if (index === slides.length - 1) {
      setViewedSlides(true)
    }
  }, [])

  const renderCarouselItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: CarouselItem }) => {
      return (
        <Box flex={1} justifyContent="center">
          <ImageBox
            flexShrink={1}
            source={item.image}
            resizeMode="contain"
            alignSelf="center"
            width={wp(50)}
          />
          <Text
            variant="h1"
            textAlign="center"
            marginTop={item.imageVerticalOffset}
          >
            {t(item.titleKey)}
          </Text>
          <TextTransform
            variant="body1"
            colorTextVariant="bold"
            textAlign="center"
            color="secondaryText"
            marginTop="m"
            i18nKey={t(item.bodyKey)}
          />
        </Box>
      )
    },
    [t],
  )

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <SafeAreaBox flex={1} edges={edges}>
        <Box
          paddingTop="xxl"
          paddingBottom="xl"
          backgroundColor="primaryBackground"
        >
          <Text variant="h4" textAlign="center">
            {t('defiTutorial.title')}
          </Text>
        </Box>
        <Carousel
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
          data={slides}
          renderItem={renderCarouselItem}
          progress={progress}
          onSnapToItem={onSnapToItem}
        />
        <Box>
          <Pagination
            count={slides.length}
            progress={progress}
            dotStyle={{ ...styles.dot, backgroundColor: colors.white }}
            activeDotStyle={{
              ...styles.activeDot,
              backgroundColor: colors.white,
            }}
            containerStyle={styles.pagination}
          />

          <ButtonPressable
            marginBottom="l"
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="surfaceSecondary"
            backgroundColorDisabledOpacity={0.5}
            titleColorDisabled="secondaryText"
            title={t('defiTutorial.enterDApps')}
            titleColor="black"
            marginHorizontal="l"
            onPress={handleEnterDAppPressed}
            disabled={!viewedSlides}
          />
        </Box>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

const styles = StyleSheet.create({
  carousel: {
    flex: 1,
    width: wp(90),
    alignSelf: 'center',
    overflow: 'visible',
  },
  carouselContent: { overflow: 'visible' },
  dot: { width: 6, height: 6, borderRadius: 3, opacity: 0.4 },
  activeDot: { opacity: 1 },
  pagination: { paddingVertical: 30, justifyContent: 'center', gap: 16 },
})

export default memo(DAppTutorial)
