import wordlist from '@constants/wordlists/english.json'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { X } from 'lucide-react-native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import MatchingWord from './MatchingWord'

const SafeArea = withUniwind(SafeAreaView)
const CloseIcon = withUniwind(X)

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
  const { t } = useTranslation()
  const ordinal = wordIdx <= totalWords ? t(`ordinals.${wordIdx}`) : ''

  const matchingWords = wordlist.filter(
    (w) => w.indexOf(word.toLowerCase()) === 0,
  )

  const handleWordSelect = (selectedWord: string) => {
    setWord('')
    onSelectWord(selectedWord, wordIdx)
  }

  const handleSubmit = () => {
    if (matchingWords.length === 0) return

    handleWordSelect(matchingWords[0])
  }

  return (
    <Modal
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
      animationType="fade"
    >
      <View className="absolute inset-0 bg-navy opacity-[0.97]" />
      <SafeArea className="flex-1">
        <PressableScale
          feedback="opacity"
          hitSlop={16}
          className="self-start p-6"
          onPress={onRequestClose}
        >
          <CloseIcon size={24} colorClassName="accent-navy-foreground" />
        </PressableScale>
        <View className="mt-12">
          <View className="min-h-[53px]">
            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              horizontal
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsHorizontalScrollIndicator={false}
            >
              {matchingWords.length <= 20 &&
                matchingWords.map((matchingWord, idx) => (
                  <MatchingWord
                    key={`${matchingWord}.${idx}`}
                    fullWord={matchingWord}
                    matchingText={word.toLowerCase()}
                    onPress={handleWordSelect}
                  />
                ))}
            </ScrollView>
          </View>
          <View className="mx-6 mb-2">
            <Input
              placeholder={t('accountImport.wordEntry.placeholder', {
                ordinal,
              })}
              onChangeText={setWord}
              onSubmitEditing={handleSubmit}
              value={word}
              autoCapitalize="characters"
              keyboardAppearance="dark"
              autoCorrect={false}
              autoComplete="off"
              blurOnSubmit={false}
              returnKeyType="next"
              autoFocus
              placeholderTextColorClassName="accent-navy-foreground/50"
              className="bg-navy-glass text-navy-foreground"
            />
          </View>
        </View>
      </SafeArea>
    </Modal>
  )
}

export default ImportReplaceWordModal
