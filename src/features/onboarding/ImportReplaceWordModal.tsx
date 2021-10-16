import React, { useCallback, useEffect, useState } from 'react'
import { Modal, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/close.svg'
import MatchingWord from './MatchingWord'
import wordlist from '../../constants/wordlists/english.json'
import TextInput from '../../components/TextInput'
import Box from '../../components/Box'
import SafeAreaBox from '../../components/SafeAreaBox'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors } from '../../theme/themeHooks'

type Props = {
  onSelectWord: (fullWord: string, idx: number) => void
  wordIdx: number
  visible: boolean
  onRequestClose: () => void
}

export const TOTAL_WORDS = 12

const ImportReplaceWordModal = ({
  onSelectWord,
  wordIdx,
  visible,
  onRequestClose,
}: Props) => {
  const [word, setWord] = useState('')
  const [matchingWords, setMatchingWords] = useState<Array<string>>([])
  const { t } = useTranslation()
  const ordinal = wordIdx <= TOTAL_WORDS ? t(`ordinals.${wordIdx}`) : ''
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
            placeholder={t('accountImport.wordEntry.placeholder', {
              ordinal,
            })}
            marginHorizontal="l"
            variant="regular"
            onChangeText={setWord}
            onSubmitEditing={handleSubmit}
            value={word}
            keyboardAppearance="dark"
            autoCorrect={false}
            autoCompleteType="off"
            blurOnSubmit={false}
            returnKeyType="next"
            marginBottom="s"
            autoFocus
          />
        </Box>
      </SafeAreaBox>
    </Modal>
  )
}

export default ImportReplaceWordModal
