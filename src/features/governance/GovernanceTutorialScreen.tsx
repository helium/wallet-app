import { useNavigation } from '@react-navigation/native'
import { useAppStorage } from '@storage/AppStorageProvider'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { useContentWidth } from '@utils/layout'
import { X } from 'lucide-react-native'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { Carousel, Pagination } from 'react-native-reanimated-carousel'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { useResolveClassNames, withUniwind } from 'uniwind'
import { GovernanceNavigationProp } from './governanceTypes'

const SafeArea = withUniwind(SafeAreaView)
const CloseIcon = withUniwind(X)

// Bold highlights in the slide bodies (en.ts uses <primaryText> and
// <caribbeanGreen>).
const bodyComponents = {
  primaryText: <Text size="base" className="font-bold text-foreground" />,
  caribbeanGreen: <Text size="base" className="font-bold text-success-500" />,
}

type CarouselItem = {
  titleKey: string
  bodyKey: string
  image: Element
  imageClassName?: string
}

const slides: Array<CarouselItem> = [
  {
    titleKey: 'gov.tutorial.slides.0.title',
    bodyKey: 'gov.tutorial.slides.0.body',
    image: require('@assets/images/voteSlide0.png'),
    imageClassName: '-mt-12',
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
    imageClassName: 'mt-12',
  },
  {
    titleKey: 'gov.tutorial.slides.3.title',
    bodyKey: 'gov.tutorial.slides.3.body',
    image: require('@assets/images/voteSlide3.png'),
    imageClassName: 'mt-12',
  },
  {
    titleKey: 'gov.tutorial.slides.4.title',
    bodyKey: 'gov.tutorial.slides.4.body',
    image: require('@assets/images/voteSlide4.png'),
    imageClassName: 'mt-12',
  },
]

export const GovernanceTutorialScreen = () => {
  const { t } = useTranslation()
  const progress = useSharedValue(0)
  const [viewedSlides, setViewedSlides] = useState(false)
  const { backgroundColor } = useResolveClassNames('bg-foreground')
  const dotColor =
    typeof backgroundColor === 'string' ? backgroundColor : undefined
  const contentWidth = useContentWidth()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const { setVoteTutorialCompleted } = useAppStorage()
  const edges = useMemo(() => ['top'] as Edge[], [])

  const handleVotePressed = useCallback(() => {
    void setVoteTutorialCompleted()
    navigation.replace('ProposalsScreen', {})
  }, [navigation, setVoteTutorialCompleted])

  const onSnapToItem = useCallback((index: number) => {
    if (index === slides.length - 1) {
      setViewedSlides(true)
    }
  }, [])

  const renderCarouselItem = useCallback(
    ({ item }: { item: CarouselItem }) => {
      return (
        <View className="flex-1">
          <Image
            className="shrink self-center"
            source={item.image as never}
            resizeMode="contain"
          />
          <Text
            size="3xl"
            className={`text-center font-semibold ${item.imageClassName ?? ''}`}
          >
            {t(item.titleKey)}
          </Text>
          <Text size="base" className="mt-4 text-center text-muted-foreground">
            <Trans i18nKey={item.bodyKey} components={bodyComponents} />
          </Text>
        </View>
      )
    },
    [t],
  )

  return (
    <SafeArea className="flex-1 bg-background" edges={edges}>
      <PressableScale
        feedback="opacity"
        className="self-end p-6"
        accessibilityRole="button"
        onPress={navigation.goBack}
      >
        <CloseIcon size={24} colorClassName="accent-foreground" />
      </PressableScale>
      <View className="grow justify-center">
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
            dotStyle={{ ...styles.dot, backgroundColor: dotColor }}
            activeDotStyle={{ ...styles.activeDot, backgroundColor: dotColor }}
            containerStyle={styles.pagination}
          />

          <View className="mx-7 my-4 flex-row">
            <Button
              size="dashboard"
              className={`flex-1 rounded-full ${
                viewedSlides ? '' : 'bg-transparent'
              }`}
              onPress={handleVotePressed}
              testID="GovernanceTutorial.Start"
            >
              {viewedSlides ? t('gov.tutorial.goToVote') : ' '}
            </Button>
          </View>
        </View>
      </View>
    </SafeArea>
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

export default memo(GovernanceTutorialScreen)
