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
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useAppStorage } from '@storage/AppStorageProvider'
import { Spacing } from '@theme/theme'
import { useColors, useSpacing } from '@theme/themeHooks'
import { wp } from '@utils/layout'
import { VoteNavigatorNavigationProp } from './voteNavigatorTypes'

type CarouselItem = {
  titleKey: string
  bodyKey: string
  image: Element
  imageVerticalOffset?: Spacing
}
const slides: Array<CarouselItem> = [
  {
    titleKey: 'vote.tutorial.slides.0.title',
    bodyKey: 'vote.tutorial.slides.0.body',
    image: require('@assets/images/voteSlide0.png'),
    imageVerticalOffset: 'n_xxl',
  },
  {
    titleKey: 'vote.tutorial.slides.1.title',
    bodyKey: 'vote.tutorial.slides.1.body',
    image: require('@assets/images/voteSlide1.png'),
  },
  {
    titleKey: 'vote.tutorial.slides.2.title',
    bodyKey: 'vote.tutorial.slides.2.body',
    image: require('@assets/images/voteSlide2.png'),
    imageVerticalOffset: 'xxl',
  },
  {
    titleKey: 'vote.tutorial.slides.3.title',
    bodyKey: 'vote.tutorial.slides.3.body',
    image: require('@assets/images/voteSlide3.png'),
    imageVerticalOffset: 'xxl',
  },
  {
    titleKey: 'vote.tutorial.slides.4.title',
    bodyKey: 'vote.tutorial.slides.4.body',
    image: require('@assets/images/voteSlide4.png'),
    imageVerticalOffset: 'xxl',
  },
]
const VoteTutorial = () => {
  const { t } = useTranslation()
  const carouselRef = useRef<Carousel<CarouselItem>>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [viewedSlides, setViewedSlides] = useState(false)
  const spacing = useSpacing()
  const colors = useColors()
  const navigation = useNavigation<VoteNavigatorNavigationProp>()
  const { setVoteTutorialCompleted } = useAppStorage()
  const edges = useMemo((): Edge[] => ['bottom'], [])

  const handleVotePressed = useCallback(() => {
    setVoteTutorialCompleted()
    navigation.replace('VoteList')
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

        <TouchableOpacityBox
          backgroundColor={viewedSlides ? 'purpleHeart' : undefined}
          padding="lm"
          borderRadius="round"
          marginHorizontal="lx"
          marginVertical="m"
          disabled={!viewedSlides}
          onPress={handleVotePressed}
        >
          <Text variant="subtitle2" textAlign="center">
            {viewedSlides ? t('vote.tutorial.goToVote') : ' '}
          </Text>
        </TouchableOpacityBox>
      </Box>
    </SafeAreaBox>
  )
}

export default memo(VoteTutorial)
