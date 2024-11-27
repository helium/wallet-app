import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Carousel, Pagination } from 'react-native-snap-carousel'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import TextTransform from '@components/TextTransform'
import { useAppStorage } from '@config/storage/AppStorageProvider'
import { Spacing } from '@config/theme/theme'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import { wp } from '@utils/layout'
import ButtonPressable from '@components/ButtonPressable'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
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
    imageVerticalOffset: '-12',
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
    imageVerticalOffset: '12',
  },
  {
    titleKey: 'gov.tutorial.slides.3.title',
    bodyKey: 'gov.tutorial.slides.3.body',
    image: require('@assets/images/voteSlide3.png'),
    imageVerticalOffset: '12',
  },
  {
    titleKey: 'gov.tutorial.slides.4.title',
    bodyKey: 'gov.tutorial.slides.4.body',
    image: require('@assets/images/voteSlide4.png'),
    imageVerticalOffset: '12',
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
  const { bottom } = useSafeAreaInsets()

  const handleVotePressed = useCallback(() => {
    setVoteTutorialCompleted()
    navigation.replace('ProposalsScreen', {})
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
        <Box flex={1} justifyContent="center">
          <ImageBox
            flexShrink={1}
            source={item.image}
            resizeMode="contain"
            alignSelf="center"
            width={150}
          />
          <Text
            variant="displayMdSemibold"
            textAlign="center"
            marginTop={item.imageVerticalOffset}
            color="primaryText"
          >
            {t(item.titleKey)}
          </Text>
          <TextTransform
            variant="textMdRegular"
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
      backgroundColor: colors.primaryText,
    }),
    [colors, spacing],
  )

  return (
    <Box flex={1}>
      <Box flexGrow={1} justifyContent="center" paddingTop="6">
        <NativeViewGestureHandler disallowInterruption>
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
        </NativeViewGestureHandler>

        <Box>
          <Pagination
            dotsLength={slides.length}
            activeDotIndex={slideIndex}
            dotStyle={dotStyle}
            inactiveDotOpacity={0.4}
            inactiveDotScale={1}
          />

          <Box
            flexDirection="row"
            marginHorizontal="7"
            style={{
              marginBottom: bottom + spacing['0.5'],
            }}
          >
            <ButtonPressable
              flex={1}
              fontSize={16}
              borderRadius="full"
              title={t('gov.tutorial.goToVote')}
              titleColor="primaryBackground"
              backgroundColor="primaryText"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="bg.disabled"
              titleColorDisabled="text.disabled"
              onPress={handleVotePressed}
              disabled={!viewedSlides}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default memo(GovernanceTutorialScreen)
