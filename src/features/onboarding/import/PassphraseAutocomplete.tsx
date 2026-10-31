import wordlist from '@constants/wordlists/english.json'
import Clipboard from '@react-native-clipboard/clipboard'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { upperCase } from 'lodash'
import { ArrowRight } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { withUniwind } from 'uniwind'
import MatchingWord from './MatchingWord'

const SubmitIcon = withUniwind(ArrowRight)

type Props = {
  onSelectWord: (fullWord: string, idx: number) => void
  wordIdx: number
  totalWords: number
  onSubmit: () => void
  complete: boolean
  word: string | null
  onPaste: (copiedContent: string) => void
}

const PassphraseAutocomplete = ({
  onSelectWord,
  wordIdx,
  totalWords,
  onSubmit,
  complete,
  word: propsWord,
  onPaste,
}: Props) => {
  const [word, setWord] = useState('')
  const { t } = useTranslation()
  const ordinal = wordIdx < totalWords ? t(`ordinals.${wordIdx}`) : ''
  const matchingListRef = useRef<ScrollView>(null)
  const [synced, setSynced] = useState<{
    wordIdx: number
    complete: boolean
    propsWord: string | null
  }>()

  if (
    wordIdx !== synced?.wordIdx ||
    complete !== synced.complete ||
    propsWord !== synced.propsWord
  ) {
    setSynced({ wordIdx, complete, propsWord })
    if (wordIdx !== synced?.wordIdx || complete) {
      setWord(propsWord ? upperCase(propsWord) : '')
    }
  }

  const matchingWords = wordlist.filter(
    (w) => w.indexOf(word.trim().toLowerCase()) === 0,
  )

  const handleWordSelect = (selectedWord: string) => {
    onSelectWord(selectedWord, wordIdx)
  }

  const handlePaste = async (text: string) => {
    const copiedContent = await Clipboard.getString()

    const isPasted = text.includes(copiedContent)
    // Check of copited content is an array of words greater than or equal to 12
    const isPastedWords = copiedContent.split(' ').length >= 12
    if (copiedContent !== '' && isPasted && isPastedWords) {
      onPaste(copiedContent)
    }
  }

  const onChangeText = (text: string) => {
    void handlePaste(text)
    matchingListRef?.current?.scrollTo({
      y: 0,
      animated: true,
    })
    setWord(text)
  }

  const handleSubmit = () => {
    if (matchingWords.length === 0 || !word || word?.length === 1) return

    if (complete) {
      onSubmit()
      return
    }

    handleWordSelect(matchingWords[0])
  }

  return (
    <>
      <View className="mx-6 mb-2">
        <Input
          testID="PassphraseAutocomplete.Input"
          placeholder={t('accountImport.wordEntry.placeholder', { ordinal })}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          value={word}
          keyboardAppearance="dark"
          autoCorrect={false}
          autoComplete="off"
          blurOnSubmit={false}
          returnKeyType="next"
          autoFocus
          autoCapitalize="characters"
          placeholderTextColorClassName="accent-navy-foreground/50"
          className="h-12 rounded-none border-0 border-b border-purple-400 px-0 text-lg text-purple-400 shadow-none"
        />

        {complete && (
          <View className="absolute right-0 top-1.5">
            <Button
              testID="PassphraseAutocomplete.Submit"
              size="icon"
              variant="cta"
              onPress={onSubmit}
              className="rounded-full"
            >
              <SubmitIcon size={18} colorClassName="accent-navy-foreground" />
            </Button>
          </View>
        )}
      </View>
      <View className="min-h-[53px]">
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          ref={matchingListRef}
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
    </>
  )
}

export default PassphraseAutocomplete
