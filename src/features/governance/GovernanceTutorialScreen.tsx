import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { Carousel, Pagination } from 'react-native-snap-carousel'
import Box from '@components/Box'
import CloseButton from '@components/CloseButton'
import ImageBox from '@components/ImageBox'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextTransform from '@components/TextTransform'
import { useAppStorage } from '@storage/AppStorageProvider'
import { Spacing } from '@theme/theme'
import { useColors, useSpacing } from '@theme/themeHooks'
import { wp } from '@utils/layout'
import ButtonPressable from '@components/ButtonPressable'
import { GovernanceNavigationProp } from './governanceTypes'

type CarouselItem = {
  titleKey: string
  bodyKey: string
  image: Element
  imageVerticalOffset?: Spacing
}

const slides: Array<CarouselItem> = [
  {
    titleKey: 'gov.tutorial.slides.0.title',
    bodyKey: 'gov.tutorial.slides.0.body',
    image: require('@assets/images/voteSlide0.png'),
    imageVerticalOffset: 'n_xxl',
  },
  {
    titleKey: 'gov.tutorial.slides.1.title',
    bodyKey: 'gov.tutorial.slides.1.body',
    image: require('@assets/images/voteSlide1.png'),
  },
  {
    titleKey: 'gov.tutorial.slides.2.title',
    bodyKey: 'gov.tutorial.slides.2.body',
    image: require('@assets/images/voteSlide2.png'),
    imageVerticalOffset: 'xxl',
  },
  {
    titleKey: 'gov.tutorial.slides.3.title',
    bodyKey: 'gov.tutorial.slides.3.body',
    image: require('@assets/images/voteSlide3.png'),
    imageVerticalOffset: 'xxl',
  },
  {
    titleKey: 'gov.tutorial.slides.4.title',
    bodyKey: 'gov.tutorial.slides.4.body',
    image: require('@assets/images/voteSlide4.png'),
    imageVerticalOffset: 'xxl',
  },
]

export const GovernanceTutorialScreen = () => {
  const { t } = useTranslation()
  const carouselRef = useRef<Carousel<CarouselItem>>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [viewedSlides, setViewedSlides] = useState(false)
  const spacing = useSpacing()
  const colors = useColors()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const { setVoteTutorialCompleted } = useAppStorage()
  const edges = useMemo(() => ['top'] as Edge[], [])

  const handleVotePressed = useCallback(() => {
    setVoteTutorialCompleted()
    navigation.replace('GovernanceScreen', {})
  }, [navigation, setVoteTutorialCompleted])

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
        <Box flex={1}>
          <ImageBox
            flexShrink={1}
            source={item.image}
            resizeMode="contain"
            alignSelf="center"
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

  const dotStyle = useMemo(
    () => ({
      width: 6,
      height: 6,
      borderRadius: 3,
      marginHorizontal: spacing.s,
      backgroundColor: colors.white,
    }),
    [colors.white, spacing.s],
  )

  return (
    <SafeAreaBox flex={1} edges={edges}>
      <CloseButton
        alignSelf="flex-end"
        padding="l"
        onPress={navigation.goBack}
      />
      <Box flexGrow={1} justifyContent="center">
        <Carousel
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

          <Box flexDirection="row" marginHorizontal="lx" marginVertical="m">
            <ButtonPressable
              flex={1}
              fontSize={16}
              borderRadius="round"
              borderWidth={2}
              backgroundColor={viewedSlides ? 'white' : undefined}
              backgroundColorOpacityPressed={0.7}
              titleColorDisabled="secondaryText"
              title={viewedSlides ? t('gov.tutorial.goToVote') : ' '}
              titleColor="black"
              onPress={handleVotePressed}
            />
          </Box>
        </Box>
      </Box>
    </SafeAreaBox>
  )
}

export default memo(GovernanceTutorialScreen)
