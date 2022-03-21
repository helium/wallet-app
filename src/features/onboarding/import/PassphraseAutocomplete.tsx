import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { upperCase } from 'lodash'
import MatchingWord from './MatchingWord'
import wordlist from '../../../constants/wordlists/english.json'
import TextInput from '../../../components/TextInput'
import Box from '../../../components/Box'
import FabButton from '../../../components/FabButton'
import usePrevious from '../../../utils/usePrevious'
import { Color } from '../../../theme/theme'

type Props = {
  onSelectWord: (fullWord: string, idx: number) => void
  wordIdx: number
  totalWords: number
  onSubmit: () => void
  complete: boolean
  word: string | null
  accentKey: Color
  accentValue: string
}

const PassphraseAutocomplete = ({
  onSelectWord,
  wordIdx,
  totalWords,
  onSubmit,
  complete,
  word: propsWord,
  accentKey,
  accentValue,
}: Props) => {
  const [word, setWord] = useState('')
  const [matchingWords, setMatchingWords] = useState<Array<string>>([])
  const { t } = useTranslation()
  const ordinal = wordIdx < totalWords ? t(`ordinals.${wordIdx}`) : ''
  const matchingListRef = useRef<ScrollView>(null)
  const prevIndex = usePrevious(wordIdx)

  useEffect(() => {
    if (wordIdx === prevIndex) return

    setWord(propsWord ? upperCase(propsWord) : '')
  }, [prevIndex, propsWord, wordIdx])

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

  const onChangeText = useCallback((text) => {
    matchingListRef?.current?.scrollTo({
      y: 0,
      animated: true,
    })
    setWord(text)
  }, [])

  const handleSubmit = useCallback(() => {
    if (matchingWords.length === 0 || !word || word?.length === 1) return

    handleWordSelect(matchingWords[0])
  }, [handleWordSelect, matchingWords, word])

  const inputStyle = useMemo(() => {
    return { color: accentValue, borderBottomColor: accentValue }
  }, [accentValue])

  return (
    <>
      <Box marginHorizontal="l">
        <TextInput
          placeholder={t('accountImport.wordEntry.placeholder', {
            ordinal,
          })}
          variant="underline"
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          value={word}
          keyboardAppearance="dark"
          autoCorrect={false}
          autoComplete="off"
          blurOnSubmit={false}
          returnKeyType="next"
          marginBottom="s"
          autoFocus
          autoCapitalize="characters"
          style={inputStyle}
        />

        {complete && (
          <Box position="absolute" right={0}>
            <FabButton
              size={36}
              onPress={onSubmit}
              icon="arrowRight"
              backgroundColor={accentKey}
              backgroundColorPressed="surfaceContrast"
              iconColor="primaryBackground"
              backgroundColorOpacityPressed={0.1}
            />
          </Box>
        )}
      </Box>
      <Box minHeight={53}>
        <ScrollView
          ref={matchingListRef}
          horizontal
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsHorizontalScrollIndicator={false}
        >
          {matchingWords.length <= 20 &&
            matchingWords.map((matchingWord, idx) => (
              <MatchingWord
                // eslint-disable-next-line react/no-array-index-key
                key={`${matchingWord}.${idx}`}
                fullWord={matchingWord}
                matchingText={word.toLowerCase()}
                onPress={handleWordSelect}
              />
            ))}
        </ScrollView>
      </Box>
    </>
  )
}

export default PassphraseAutocomplete
