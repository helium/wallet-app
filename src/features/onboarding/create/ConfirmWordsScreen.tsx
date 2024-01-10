import React, { memo, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { Animated, FlatList } from 'react-native'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import CloseButton from '@components/CloseButton'
import { Color } from '@theme/theme'
import { useColors, usePaddingStyle } from '@theme/themeHooks'
import { upperCase } from 'lodash'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import useHaptic from '@hooks/useHaptic'
import { CreateAccountNavigationProp } from './createAccountNavTypes'
import PassphraseAutocomplete from '../import/PassphraseAutocomplete'

const accentColors = [
  'purple500',
  'blueBright500',
  'greenBright500',
  'orange500',
  'persianRose',
  'grey350',
  'flamenco',
  'electricViolet',
  'malachite',
  'turquoise',
  'white',
  'red500',
] as Color[]

type Props = {
  title?: string
  onComplete: () => void
  onForgotWords?: () => void
  mnemonic: string[]
}

const ConfirmWordsScreen: React.FC<Props> = ({
  title,
  onComplete,
  onForgotWords,
  mnemonic,
}) => {
  const { triggerImpact } = useHaptic()
  const [wordIndex, setWordIndex] = useState(0)
  const shakeAnim = useRef(new Animated.Value(0))
  const { t } = useTranslation()
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const flatlistRef = useRef<FlatList>(null)
  const colors = useColors()
  const flatListStyle = usePaddingStyle('m', ['left', 'right'])
  const wordCount = mnemonic.length
  const [words, setWords] = useState<(string | null)[]>(
    new Array(wordCount).fill(null),
  )

  const getAccent = useCallback(
    (idx) => {
      return {
        key: accentColors[idx % 12],
        value: colors[accentColors[idx % 12]],
      }
    },
    [colors],
  )

  const findTargetWord = useCallback(
    (pos: number) => {
      return mnemonic[pos]
    },
    [mnemonic],
  )

  const wordFailure = useCallback(() => {
    const { current } = shakeAnim
    const move = (direction: 'left' | 'right' | 'center') => {
      let value = 0
      if (direction === 'left') value = -15
      if (direction === 'right') value = 15
      return Animated.timing(current, {
        toValue: value,
        duration: 85,
        useNativeDriver: true,
      })
    }

    Animated.sequence([
      move('left'),
      move('right'),
      move('left'),
      move('right'),
      move('center'),
    ]).start()

    triggerImpact()
  }, [triggerImpact])

  const handleSelectWord = useCallback(
    (selectedWordd: string) => {
      if (selectedWordd === findTargetWord(wordIndex)) {
        setWords((w) => [
          ...w.slice(0, wordIndex),
          selectedWordd,
          ...w.slice(wordIndex + 1),
        ])

        if (wordIndex === wordCount - 1) return
        setWordIndex(wordIndex + 1)
      } else {
        wordFailure()
      }
    },
    [wordCount, wordIndex, findTargetWord, wordFailure],
  )

  const handleContentSizeChanged = useCallback(() => {
    flatlistRef.current?.scrollToIndex({
      index:
        wordIndex === words.length - 1 || wordIndex < 2
          ? wordIndex
          : wordIndex - 1,
      animated: true,
    })
  }, [wordIndex, words.length])

  const keyExtractor = useCallback((_item, index) => index, [])

  const handleWordSelectedAtIndex = useCallback(
    (index: number) => () => {
      setWordIndex(index)
    },
    [],
  )

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item: w }: { item: string | null; index: number }) => {
      return (
        <TouchableOpacityBox
          paddingHorizontal="s"
          onPress={handleWordSelectedAtIndex(index)}
          paddingVertical="lm"
          alignItems="center"
        >
          <Text
            variant="body1"
            color={
              w || wordIndex === index ? getAccent(index).key : 'secondaryText'
            }
          >
            {upperCase(
              w || t('accountImport.wordEntry.word', { ordinal: index + 1 }),
            )}
          </Text>
        </TouchableOpacityBox>
      )
    },
    [getAccent, handleWordSelectedAtIndex, t, wordIndex],
  )

  const handleOnPaste = useCallback((copiedContent: string) => {
    setWords(copiedContent.split(' '))
  }, [])

  const onSkip = useCallback(() => {
    if (__DEV__) {
      onComplete()
    }
  }, [onComplete])

  const onClose = useCallback(() => {
    if (!navigation.canGoBack()) return

    navigation.goBack()
  }, [navigation])

  const onPressForgot = useCallback(() => {
    if (onForgotWords) {
      onForgotWords()
      return
    }

    onClose()
  }, [onClose, onForgotWords])

  const handleOnComplete = useCallback(() => {
    if (words.every((w, idx) => mnemonic[idx] === w)) {
      onComplete()
    } else {
      wordFailure()
    }
  }, [words, mnemonic, wordFailure, onComplete])

  return (
    <Box flex={1} backgroundColor="secondaryBackground">
      <Box width="100%" alignItems="flex-end">
        <CloseButton onPress={onClose} />
      </Box>
      <KeyboardAwareScrollView
        extraScrollHeight={80}
        enableOnAndroid
        keyboardShouldPersistTaps="always"
      >
        <Animated.View
          style={{ transform: [{ translateX: shakeAnim.current }] }}
        >
          <Text
            variant="subtitle1"
            color="secondaryText"
            textAlign="center"
            marginTop="m"
          >
            {title || t('accountSetup.confirm.title')}
          </Text>
          <Text
            variant="h1"
            textAlign="center"
            marginTop="m"
            fontSize={40}
            lineHeight={40}
          >
            {t('accountSetup.confirm.subtitleOrdinal', {
              ordinal: wordIndex + 1,
            })}
          </Text>
          <FlatList
            data={words}
            contentContainerStyle={flatListStyle}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            horizontal
            ref={flatlistRef}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={wordIndex}
            onContentSizeChange={handleContentSizeChanged}
          />
          <PassphraseAutocomplete
            word={words[wordIndex]}
            complete={words.findIndex((w) => !w) === -1}
            onSelectWord={handleSelectWord}
            wordIdx={wordIndex}
            totalWords={wordCount}
            onSubmit={handleOnComplete}
            accentKey={getAccent(wordIndex).key}
            accentValue={getAccent(wordIndex).value}
            onPaste={handleOnPaste}
          />
        </Animated.View>
        <Box flex={1} justifyContent="center" alignItems="center">
          <TouchableOpacityBox onPress={onPressForgot} paddingVertical="xxxl">
            <Text
              variant="h4"
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1}
              textAlign="center"
              color="secondaryText"
            >
              {t('accountSetup.confirm.forgot')}
            </Text>
          </TouchableOpacityBox>
          {__DEV__ && (
            <TouchableOpacityBox onPress={onSkip}>
              <Text
                variant="h4"
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1}
                textAlign="center"
                color="secondaryText"
              >
                {t('generic.skip')}
              </Text>
            </TouchableOpacityBox>
          )}
        </Box>
      </KeyboardAwareScrollView>
    </Box>
  )
}

export default memo(ConfirmWordsScreen)
