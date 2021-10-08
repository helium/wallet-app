import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, StyleSheet } from 'react-native'
import { upperFirst } from 'lodash'
import Carousel, { Pagination } from 'react-native-snap-carousel'
import Box from '../../components/Box'
import Text from '../../components/Text'
import {
  OnboardingNavigationProp,
  OnboardingStackParamList,
} from './onboardingTypes'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { wp } from '../../utils/layout'
import ImportReplaceWordModal from './ImportReplaceWordModal'
import SafeAreaBox from '../../components/SafeAreaBox'

type Route = RouteProp<OnboardingStackParamList, 'ImportAccountConfirmScreen'>
const ImportAccountConfirmScreen = () => {
  const { t } = useTranslation()
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null)
  const [words, setWords] = useState<Array<string>>([])
  const navigation = useNavigation<OnboardingNavigationProp>()
  const {
    params: { words: routeWords, multiAccount },
  } = useRoute<Route>()
  const [wordIndex, setWordIndex] = useState(0)

  const onSnapToItem = (index: number) => {
    setWordIndex(index)
  }

  const navNext = useCallback(
    () =>
      navigation.navigate('AccountImportCompleteScreen', {
        words,
        multiAccount,
      }),
    [multiAccount, navigation, words],
  )

  useEffect(() => {
    setWords(routeWords)
  }, [routeWords])

  const clearSelection = () => setSelectedWordIdx(null)

  const handleWordEdit = (idx: number) => () => setSelectedWordIdx(idx)

  const replaceWord = (newWord: string, idx: number) => {
    clearSelection()

    setWords((prevWords) => {
      const nextWords = [...prevWords]
      nextWords[idx] = newWord
      return nextWords
    })
  }

  const renderItem = useCallback(
    ({ item, index }) => (
      <TouchableOpacityBox
        height={{ smallPhone: 84, phone: 114 }}
        onPress={handleWordEdit(index)}
      >
        <Box
          marginHorizontal="s"
          flex={1}
          overflow="hidden"
          backgroundColor="surface"
          paddingHorizontal="l"
          alignItems="center"
          flexDirection="row"
          borderRadius="m"
        >
          <Text variant="h1" color="surfaceText" maxFontSizeMultiplier={1}>{`${
            index + 1
          }. `}</Text>
          <Text variant="h1" color="surfaceText" maxFontSizeMultiplier={1}>
            {upperFirst(item)}
          </Text>
        </Box>
      </TouchableOpacityBox>
    ),
    [],
  )

  return (
    <SafeAreaBox backgroundColor="primaryBackground" flex={1} padding="l">
      <Box>
        <Text
          marginTop="l"
          variant="subtitle1"
          fontSize={27}
          numberOfLines={2}
          maxFontSizeMultiplier={1}
          adjustsFontSizeToFit
          marginBottom="s"
        >
          {t('account_import.confirm.title')}
        </Text>
        <Text variant="subtitle1" fontSize={20} maxFontSizeMultiplier={1.1}>
          {t('account_import.confirm.subtitle')}
        </Text>
      </Box>
      <Box marginHorizontal="n_lx" marginVertical="l">
        <Carousel
          layout="default"
          vertical={false}
          data={words}
          renderItem={renderItem}
          sliderWidth={wp(100)}
          itemWidth={wp(90)}
          inactiveSlideScale={1}
          onSnapToItem={(i) => onSnapToItem(i)}
        />
        <Pagination
          containerStyle={styles.dotContainer}
          dotsLength={words.length}
          activeDotIndex={wordIndex}
          dotStyle={styles.dots}
          inactiveDotOpacity={0.4}
          inactiveDotScale={1}
        />
      </Box>
      <Box
        paddingHorizontal="l"
        paddingBottom="l"
        height={60}
        justifyContent="flex-end"
      >
        <Button onPress={navNext} title={t('account_import.confirm.next')} />
      </Box>
      <ImportReplaceWordModal
        visible={selectedWordIdx !== null}
        onRequestClose={clearSelection}
        onSelectWord={replaceWord}
        wordIdx={selectedWordIdx ?? 0}
      />
    </SafeAreaBox>
  )
}

const styles = StyleSheet.create({
  dots: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  dotContainer: { marginTop: 24 },
})

export default ImportAccountConfirmScreen
