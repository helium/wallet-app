import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { Carousel, Pagination } from 'react-native-snap-carousel'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextTransform from '@components/TextTransform'
import { useAppStorage } from '@storage/AppStorageProvider'
import { Spacing } from '@theme/theme'
import { useColors, useSpacing } from '@theme/themeHooks'
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
    imageVerticalOffset: '-12',
  },
  {
    titleKey: 'defiTutorial.slides.1.title',
    bodyKey: 'defiTutorial.slides.1.body',
    image: require('@assets/images/defiSlide2.png'),
    imageVerticalOffset: '-12',
  },
  {
    titleKey: 'defiTutorial.slides.2.title',
    bodyKey: 'defiTutorial.slides.2.body',
    image: require('@assets/images/defiSlide3.png'),
    imageVerticalOffset: '-12',
  },
  {
    titleKey: 'defiTutorial.slides.3.title',
    bodyKey: 'defiTutorial.slides.3.body',
    image: require('@assets/images/defiSlide4.png'),
    imageVerticalOffset: '-12',
  },
]
const DAppTutorial = () => {
  const { t } = useTranslation()
  const carouselRef = useRef<Carousel<CarouselItem>>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [viewedSlides, setViewedSlides] = useState(false)
  const spacing = useSpacing()
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
    setSlideIndex(index)
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
            variant="displayMdRegular"
            textAlign="center"
            marginTop={item.imageVerticalOffset}
            color="primaryText"
          >
            {t(item.titleKey)}
          </Text>
          <TextTransform
            variant="textMdBold"
            textAlign="center"
            color="secondaryText"
            marginTop="4"
            i18nKey={t(item.bodyKey)}
          />
        </Box>
      )
    },
    [t],
  )

  const dotStyle = useMemo(
    () => ({
      width: 6,
      height: 6,
      borderRadius: 3,
      marginHorizontal: spacing['0.5'],
      backgroundColor: colors['base.white'],
    }),
    [colors['base.white'], spacing['0.5']],
  )

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <SafeAreaBox flex={1} edges={edges}>
        <Box
          paddingTop="12"
          paddingBottom="8"
          backgroundColor="primaryBackground"
        >
          <Text variant="textXlRegular" textAlign="center">
            {t('defiTutorial.title')}
          </Text>
        </Box>
        <Carousel
          style={{ backgroundColor: 'blue' }}
          ref={carouselRef}
          layout="default"
          vertical={false}
          data={slides}
          renderItem={renderCarouselItem}
          sliderWidth={wp(100)}
          itemWidth={wp(90)}
          onSnapToItem={onSnapToItem}
        />
        <Box>
          <Pagination
            dotsLength={slides.length}
            activeDotIndex={slideIndex}
            dotStyle={dotStyle}
            inactiveDotOpacity={0.4}
            inactiveDotScale={1}
          />

          <ButtonPressable
            marginBottom="6"
            borderRadius="full"
            backgroundColor="primaryText"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="bg.disabled"
            titleColorDisabled="text.disabled"
            title={t('defiTutorial.enterDApps')}
            titleColor="primaryBackground"
            marginHorizontal="6"
            onPress={handleEnterDAppPressed}
            disabled={!viewedSlides}
          />
        </Box>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default memo(DAppTutorial)
