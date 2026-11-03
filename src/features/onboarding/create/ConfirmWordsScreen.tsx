import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import useHaptic from '@hooks/useHaptic'
import useSecureWindow from '@hooks/useSecureWindow'
import { useNavigation } from '@react-navigation/native'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { upperCase } from 'lodash'
import { X } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { useTranslation } from 'react-i18next'
import { Animated, FlatList, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { withUniwind } from 'uniwind'
import PassphraseAutocomplete from '../import/PassphraseAutocomplete'
import { CreateAccountNavigationProp } from './createAccountNavTypes'

const CloseIcon = withUniwind(X)

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
  useSecureWindow()
  const { triggerImpact } = useHaptic()
  const [wordIndex, setWordIndex] = useState(0)
  const [shakeAnim] = useState(() => new Animated.Value(0))
  const { t } = useTranslation()
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const flatlistRef = useRef<FlatList>(null)
  const wordCount = mnemonic.length
  const [words, setWords] = useState<(string | null)[]>(
    new Array(wordCount).fill(null),
  )

  const findTargetWord = (pos: number) => mnemonic[pos]

  const wordFailure = () => {
    const move = (direction: 'left' | 'right' | 'center') => {
      let value = 0
      if (direction === 'left') value = -15
      if (direction === 'right') value = 15
      return Animated.timing(shakeAnim, {
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
  }

  const handleSelectWord = (selectedWordd: string) => {
    if (selectedWordd === findTargetWord(wordIndex)) {
      setWords((w) => [
        ...w.slice(0, wordIndex),
        selectedWordd,
        ...w.slice(wordIndex + 1),
      ])

      setWordIndex(wordIndex === wordCount - 1 ? wordIndex : wordIndex + 1)
    } else {
      wordFailure()
    }
  }

  const handleContentSizeChanged = () => {
    flatlistRef.current?.scrollToIndex({
      index:
        wordIndex === words.length - 1 || wordIndex < 2
          ? wordIndex
          : wordIndex - 1,
      animated: true,
    })
  }

  const keyExtractor = (_item: string | null, index: number) => String(index)

  const wordClassName = (w: string | null, index: number) => {
    if (w) return 'text-navy-foreground'
    if (wordIndex === index) return 'text-purple-400'
    return 'text-navy-foreground/50'
  }

  const renderItem = ({
    index,
    item: w,
  }: {
    item: string | null
    index: number
  }) => (
    <PressableScale
      feedback="opacity"
      className="items-center px-2 py-5"
      onPress={() => setWordIndex(index)}
    >
      <Text size="base" className={wordClassName(w, index)}>
        {upperCase(
          w || t('accountImport.wordEntry.word', { ordinal: index + 1 }),
        )}
      </Text>
    </PressableScale>
  )

  const handleOnPaste = (copiedContent: string) => {
    setWords(copiedContent.split(' '))
  }

  const onSkip = () => {
    if (__DEV__) {
      onComplete()
    }
  }

  const onClose = () => {
    if (!navigation.canGoBack()) return

    navigation.goBack()
  }

  const onPressForgot = () => {
    if (onForgotWords) {
      onForgotWords()
      return
    }

    onClose()
  }

  const handleOnComplete = () => {
    if (words.every((w, idx) => mnemonic[idx] === w)) {
      onComplete()
    } else {
      wordFailure()
    }
  }

  return (
    <View className="flex-1 bg-navy">
      <FocusAwareStatusBar barStyle="light-content" />
      <View className="w-full items-end">
        <PressableScale
          feedback="opacity"
          hitSlop={16}
          className="p-6"
          onPress={onClose}
        >
          <CloseIcon size={16} colorClassName="accent-navy-foreground" />
        </PressableScale>
      </View>
      <KeyboardAwareScrollView
        extraKeyboardSpace={80}
        bottomOffset={155}
        keyboardShouldPersistTaps="always"
      >
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Text size="lg" className="mt-4 text-center text-navy-foreground/50">
            {title || t('accountSetup.confirm.title')}
          </Text>
          <Text
            size="4xl"
            className="mt-4 text-center font-medium leading-10 text-navy-foreground"
          >
            {t('accountSetup.confirm.subtitleOrdinal', {
              ordinal: wordIndex + 1,
            })}
          </Text>
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            data={words}
            contentContainerClassName="px-4"
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
            onPaste={handleOnPaste}
          />
        </Animated.View>
        <View className="flex-1 items-center justify-center">
          <PressableScale
            feedback="opacity"
            className="py-12"
            onPress={onPressForgot}
          >
            <Text
              size="lg"
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1}
              className="text-center text-navy-foreground/50"
            >
              {t('accountSetup.confirm.forgot')}
            </Text>
          </PressableScale>
          {__DEV__ && (
            <PressableScale feedback="opacity" onPress={onSkip}>
              <Text
                size="lg"
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1}
                className="text-center text-navy-foreground/50"
              >
                {t('generic.skip')}
              </Text>
            </PressableScale>
          )}
        </View>
        <TabSafeAreaView edges={['bottom']} />
      </KeyboardAwareScrollView>
    </View>
  )
}

export default ConfirmWordsScreen
