import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { upperCase } from 'lodash'
import Carousel, { Pagination } from 'react-native-snap-carousel'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'
import { wp } from '../../../utils/layout'
import ImportReplaceWordModal from './ImportReplaceWordModal'
import SafeAreaBox from '../../../components/SafeAreaBox'
import { useOnboarding } from '../OnboardingProvider'
import { useColors } from '../../../theme/themeHooks'
import { ImportAccountNavigationProp } from './importAccountNavTypes'
import ButtonPressable from '../../../components/ButtonPressable'

const ImportAccountConfirmScreen = () => {
  const { t } = useTranslation()
  const colors = useColors()
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null)
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const [wordIndex, setWordIndex] = useState(0)
  const {
    onboardingData: { words },
    setOnboardingData,
  } = useOnboarding()

  const onSnapToItem = (index: number) => {
    setWordIndex(index)
  }

  const navNext = useCallback(
    () => navigation.navigate('AccountImportCompleteScreen'),
    [navigation],
  )

  const clearSelection = () => setSelectedWordIdx(null)

  const handleWordEdit = (idx: number) => () => setSelectedWordIdx(idx)

  const replaceWord = (newWord: string, idx: number) => {
    clearSelection()

    setOnboardingData((prev) => {
      const nextWords = [...prev.words]
      nextWords[idx] = newWord

      return { ...prev, words: nextWords }
    })
  }

  const renderItem = useCallback(
    ({ item, index }) => {
      const isFirst = index === 0
      const isLast = index + 1 === words?.length
      return (
        <TouchableOpacityBox
          height={{ smallPhone: 84, phone: 114 }}
          onPress={handleWordEdit(index)}
        >
          <Box
            marginLeft={isFirst ? 'l' : undefined}
            marginRight={isLast ? 'l' : undefined}
            marginHorizontal="s"
            flex={1}
            overflow="hidden"
            backgroundColor="surfaceSecondary"
            paddingHorizontal="l"
            alignItems="center"
            flexDirection="row"
            borderRadius="m"
          >
            <Text
              variant="h1"
              color="surfaceText"
              maxFontSizeMultiplier={1}
            >{`${index + 1}. `}</Text>
            <Text variant="h1" color="surfaceText" maxFontSizeMultiplier={1}>
              {upperCase(item)}
            </Text>
          </Box>
        </TouchableOpacityBox>
      )
    },
    [words.length],
  )

  return (
    <SafeAreaBox backgroundColor="primaryBackground" flex={1} padding="l">
      <Box flex={1}>
        <Box justifyContent="center" flex={1}>
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
              {t('accountImport.confirm.title')}
            </Text>
            <Text variant="subtitle1" fontSize={20} maxFontSizeMultiplier={1.1}>
              {t('accountImport.confirm.subtitle', {
                totalWords: words?.length,
              })}
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
              onScrollIndexChanged={(i) => onSnapToItem(i)}
              useExperimentalSnap
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore this is a new beta prop and enforces only scrolling one item at a time
              disableIntervalMomentum
            />
            <Pagination
              containerStyle={styles.paginationContainer}
              dotsLength={words.length}
              activeDotIndex={wordIndex}
              dotStyle={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.primaryText,
              }}
              dotContainerStyle={styles.dotContainer}
              inactiveDotOpacity={0.4}
              inactiveDotScale={1}
            />
          </Box>
        </Box>
      </Box>
      <ButtonPressable
        borderRadius="round"
        backgroundColor="blueBright500"
        backgroundColorOpacityPressed={0.8}
        onPress={navNext}
        title={t('accountImport.confirm.next')}
        titleColor="black900"
      />
      <ImportReplaceWordModal
        visible={selectedWordIdx !== null}
        onRequestClose={clearSelection}
        onSelectWord={replaceWord}
        wordIdx={selectedWordIdx ?? 0}
        totalWords={words?.length}
      />
    </SafeAreaBox>
  )
}

const styles = StyleSheet.create({
  paginationContainer: { marginTop: 24 },
  dotContainer: { marginHorizontal: 3 },
})

export default ImportAccountConfirmScreen
