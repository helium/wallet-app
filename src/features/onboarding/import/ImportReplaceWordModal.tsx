import React, { useCallback, useEffect, useState } from 'react'
import { Modal, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/close.svg'
import wordlist from '@constants/wordlists/english.json'
import TextInput from '@components/TextInput'
import Box from '@components/Box'
import SafeAreaBox from '@components/SafeAreaBox'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors } from '@theme/themeHooks'
import MatchingWord from './MatchingWord'

type Props = {
  onSelectWord: (fullWord: string, idx: number) => void
  wordIdx: number
  visible: boolean
  onRequestClose: () => void
  totalWords: number
}

const ImportReplaceWordModal = ({
  onSelectWord,
  wordIdx,
  visible,
  onRequestClose,
  totalWords,
}: Props) => {
  const [word, setWord] = useState('')
  const [matchingWords, setMatchingWords] = useState<Array<string>>([])
  const { t } = useTranslation()
  const ordinal = wordIdx <= totalWords ? t(`ordinals.${wordIdx}`) : ''
  const { primaryText } = useColors()

  useEffect(() => {
    setMatchingWords(
      wordlist.filter((w) => w.indexOf(word.toLowerCase()) === 0),
    )
  }, [word])

  const handleWordSelect = useCallback(
    (selectedWord: string) => {
      setWord('')
      onSelectWord(selectedWord, wordIdx)
    },
    [onSelectWord, wordIdx],
  )

  const handleSubmit = useCallback(() => {
    if (matchingWords.length === 0) return

    handleWordSelect(matchingWords[0])
  }, [handleWordSelect, matchingWords])

  return (
    <Modal
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
      animationType="fade"
    >
      <Box
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        right={0}
        backgroundColor="primaryBackground"
        opacity={0.97}
      />
      <SafeAreaBox flex={1}>
        <TouchableOpacityBox onPress={onRequestClose} padding="l">
          <Close color={primaryText} height={24} width={24} />
        </TouchableOpacityBox>
        <Box marginTop={{ smallPhone: 'l', phone: 'xxxl' }}>
          <Box minHeight={53}>
            <ScrollView
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
          <TextInput
            textInputProps={{
              placeholder: t('accountImport.wordEntry.placeholder', {
                ordinal,
              }),
              onChangeText: setWord,
              onSubmitEditing: handleSubmit,
              value: word,
              autoCapitalize: 'characters',
              keyboardAppearance: 'dark',
              autoCorrect: false,
              autoComplete: 'off',
              blurOnSubmit: false,
              returnKeyType: 'next',
              autoFocus: true,
            }}
            marginHorizontal="l"
            variant="underline"
            marginBottom="s"
          />
        </Box>
      </SafeAreaBox>
    </Modal>
  )
}

export default ImportReplaceWordModal
