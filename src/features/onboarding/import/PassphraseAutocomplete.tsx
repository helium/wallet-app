import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { upperCase } from 'lodash'
import wordlist from '@utils/constants/wordlists/english.json'
import TextInput from '@components/TextInput'
import Box from '@components/Box'
import usePrevious from '@hooks/usePrevious'
import Clipboard from '@react-native-community/clipboard'
import ScrollBox from '@components/ScrollBox'
import { ScrollView } from 'react-native-gesture-handler'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import MatchingWord from './MatchingWord'

type Props = {
  onSelectWord: (fullWord: string, idx: number) => void
  wordIdx: number
  onSubmit: () => void
  complete: boolean
  word: string | null
  onPaste: (copiedContent: string) => void
}

const PassphraseAutocomplete = ({
  onSelectWord,
  wordIdx,
  onSubmit,
  complete,
  word: propsWord,
  onPaste,
}: Props) => {
  const [word, setWord] = useState('')
  const [matchingWords, setMatchingWords] = useState<Array<string>>([])
  const { t } = useTranslation()
  const matchingListRef = useRef<ScrollView>(null)
  const prevIndex = usePrevious(wordIdx)
  const colors = useColors()
  const spacing = useSpacing()

  useEffect(() => {
    if (wordIdx === prevIndex && !complete) return
    setWord(propsWord ? upperCase(propsWord) : '')
  }, [complete, prevIndex, propsWord, wordIdx])

  useEffect(() => {
    setMatchingWords(
      wordlist.filter((w) => w.indexOf(word.trim().toLowerCase()) === 0),
    )
  }, [word])

  const handleWordSelect = useCallback(
    (selectedWord: string) => {
      onSelectWord(selectedWord, wordIdx)
    },
    [onSelectWord, wordIdx],
  )

  const handlePaste = useCallback(
    async (text) => {
      const copiedContent = await Clipboard.getString()

      const isPasted = text.includes(copiedContent)
      // Check of copited content is an array of words greater than or equal to 12
      const isPastedWords = copiedContent.split(' ').length >= 12
      if (copiedContent !== '' && isPasted && isPastedWords) {
        onPaste(copiedContent)
      }
    },
    [onPaste],
  )

  const onChangeText = useCallback(
    async (text) => {
      handlePaste(text)
      matchingListRef?.current?.scrollTo({
        y: 0,
        animated: true,
      })
      setWord(text)
    },
    [handlePaste],
  )

  const handleSubmit = useCallback(() => {
    if (matchingWords.length === 0 || !word || word?.length === 1) return

    if (complete) {
      onSubmit()
      return
    }

    handleWordSelect(matchingWords[0])
  }, [complete, handleWordSelect, matchingWords, onSubmit, word])

  return (
    <>
      <Box marginHorizontal="2xl">
        <Box
          backgroundColor="cardBackground"
          paddingVertical="xl"
          paddingEnd="3xl"
          borderRadius="2xl"
        >
          <TextInput
            fontWeight="600"
            textInputProps={{
              placeholder: t('accountImport.wordEntry.placeholder', {
                ordinal: wordIdx + 1,
              }),
              onChangeText,
              onSubmitEditing: handleSubmit,
              value: word,
              keyboardAppearance: 'dark',
              autoCorrect: false,
              autoComplete: 'off',
              blurOnSubmit: false,
              returnKeyType: 'next',
              autoFocus: false,
              autoCapitalize: 'characters',
              placeholderTextColor: colors['text.placeholder'],
            }}
            variant="transparentSmall"
          />
        </Box>
      </Box>
      <Box marginTop="xl">
        <ScrollBox
          ref={matchingListRef}
          horizontal
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: spacing.md,
          }}
        >
          {matchingWords.length <= 20 &&
            matchingWords.map((matchingWord, idx) => (
              <Box paddingStart={idx === 0 ? '2xl' : '0'}>
                <MatchingWord
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${matchingWord}.${idx}`}
                  fullWord={matchingWord}
                  onPress={handleWordSelect}
                />
              </Box>
            ))}
        </ScrollBox>
      </Box>
    </>
  )
}

export default PassphraseAutocomplete
