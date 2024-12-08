import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, ScrollView } from 'react-native'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useSpacing } from '@config/theme/themeHooks'
import { upperCase } from 'lodash'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import useHaptic from '@hooks/useHaptic'
import ScrollBox from '@components/ScrollBox'
import TouchableContainer from '@components/TouchableContainer'
import Box from '@components/Box'
import CheckButton from '@components/CheckButton'
import PassphraseAutocomplete from '../import/PassphraseAutocomplete'

type Props = {
  title?: string
  onComplete: () => void
  mnemonic: string[]
}

const ConfirmWordsScreen: React.FC<Props> = ({
  title,
  onComplete,
  mnemonic,
}) => {
  const { triggerImpact } = useHaptic()
  const [wordIndex, setWordIndex] = useState(0)
  const shakeAnim = useRef(new Animated.Value(0))
  const { t } = useTranslation()
  const wordCount = useMemo(() => mnemonic.length, [mnemonic])

  const spacing = useSpacing()
  const scrollViewRef = useRef<ScrollView>(null)

  const [words, setWords] = useState<(string | null)[]>(
    new Array(wordCount).fill(null),
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

  const handleWordSelectedAtIndex = useCallback(
    (index: number) => () => {
      setWordIndex(index)
    },
    [],
  )

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: wordIndex * 83,
      animated: true,
    })
  }, [wordIndex])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item: w }: { item: string | null; index: number }) => {
      const relativeIndex = Math.max(0, index - wordIndex)

      let opacity = 0.05

      switch (relativeIndex) {
        case 0:
          opacity = 1
          break
        case 1:
          opacity = 0.4
          break
        case 2:
          opacity = 0.3
          break
        case 3:
          opacity = 0.2
          break
        case 4:
          opacity = 0.1
          break
        default:
          opacity = 0.05
      }

      return (
        <TouchableContainer
          onPress={handleWordSelectedAtIndex(index)}
          paddingVertical="1.5"
          paddingHorizontal="3"
          alignItems="center"
          backgroundColor={w ? 'primaryText' : 'primaryBackground'}
          borderRadius="full"
          marginStart={index === 0 ? '2xl' : undefined}
          marginEnd={index === words.length - 1 ? '2xl' : undefined}
          opacity={opacity}
          marginBottom="xl"
          minWidth={83}
          pressableStyles={{ flex: undefined }}
        >
          <Text
            variant="textMdSemibold"
            color={w ? 'primaryBackground' : 'secondaryText'}
          >
            {upperCase(
              w || t('accountImport.wordEntry.word', { ordinal: index + 1 }),
            )}
          </Text>
        </TouchableContainer>
      )
    },
    [handleWordSelectedAtIndex, t, wordIndex, words],
  )

  const handleOnPaste = useCallback((copiedContent: string) => {
    setWords(copiedContent.split(' '))
  }, [])

  const onSkip = useCallback(() => {
    if (__DEV__) {
      onComplete()
    }
  }, [onComplete])

  const handleOnComplete = useCallback(() => {
    if (words.every((w, idx) => mnemonic[idx] === w)) {
      onComplete()
    } else {
      wordFailure()
    }
  }, [words, mnemonic, wordFailure, onComplete])

  return (
    <ScrollBox contentContainerStyle={{ flex: 1 }}>
      <KeyboardAwareScrollView
        extraScrollHeight={80}
        enableOnAndroid
        keyboardShouldPersistTaps="always"
        style={{ flex: 1 }}
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <Text
          variant="textXlMedium"
          color="text.quaternary-500"
          textAlign="center"
          marginBottom="xl"
        >
          {title || t('accountSetup.confirm.title')}
        </Text>
        <Text
          variant="displayMdSemibold"
          textAlign="center"
          marginBottom="xl"
          fontSize={40}
          lineHeight={40}
          color="primaryText"
        >
          {t('accountSetup.confirm.subtitleOrdinal', {
            ordinal: wordIndex + 1,
          })}
        </Text>
        <Box marginTop="xl" flexDirection="row">
          <ScrollBox
            ref={scrollViewRef}
            scrollEnabled
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              overflow: 'visible',
              gap: spacing.md,
            }}
          >
            {words.map((w, i) => (
              <Box key={w}>{renderItem({ item: w, index: i })}</Box>
            ))}
          </ScrollBox>
        </Box>
        <Animated.View
          style={{ transform: [{ translateX: shakeAnim.current }] }}
        >
          <PassphraseAutocomplete
            word={words[wordIndex]}
            complete={words.findIndex((w) => !w) === -1}
            onSelectWord={handleSelectWord}
            wordIdx={wordIndex}
            onSubmit={handleOnComplete}
            onPaste={handleOnPaste}
          />
        </Animated.View>
        {__DEV__ && (
          <TouchableOpacityBox onPress={onSkip}>
            <Text
              variant="textXlRegular"
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1}
              textAlign="center"
              color="secondaryText"
            >
              {t('generic.skip')}
            </Text>
          </TouchableOpacityBox>
        )}
      </KeyboardAwareScrollView>
      {words.every((w) => w !== null) && words.length === wordCount && (
        <CheckButton onPress={handleOnComplete} />
      )}
    </ScrollBox>
  )
}

export default memo(ConfirmWordsScreen)
