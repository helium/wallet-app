import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import useAlert from '@hooks/useAlert'
import useSecureWindow from '@hooks/useSecureWindow'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { upperCase } from 'lodash'
import { X } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { useTranslation } from 'react-i18next'
import { FlatList, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { withUniwind } from 'uniwind'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import {
  mnemonicDeriver,
  toSecureAccount,
} from '../../../storage/secureStorage'
import { useOnboarding } from '../OnboardingProvider'
import { OnboardingNavigationProp } from '../onboardingTypes'
import PassphraseAutocomplete from './PassphraseAutocomplete'
import { matchRestoredAccounts } from './accountRestore'
import {
  ImportAccountNavigationProp,
  ImportAccountStackParamList,
} from './importAccountNavTypes'

const CloseIcon = withUniwind(X)

type Route = RouteProp<ImportAccountStackParamList, 'AccountImportScreen'>
const AccountImportScreen = () => {
  useSecureWindow()
  const { setOnboardingData, reset } = useOnboarding()
  const { restoreSecureAccounts, hasAccounts, accounts } = useAccountStorage()
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const parentNav = useNavigation<OnboardingNavigationProp>()
  const flatlistRef = useRef<FlatList>(null)
  const {
    params: { restoringAccount, accountAddress },
  } = useRoute<Route>()
  const [wordCount, setWordCount] = useState(12)
  const { t } = useTranslation()

  const [wordIndex, setWordIndex] = useState(0)
  const [words, setWords] = useState<(string | null)[]>(
    new Array(wordCount).fill(null),
  )
  const { showOKAlert } = useAlert()

  useEffect(() => {
    return navigation.addListener('focus', () => {
      setOnboardingData((prev) => {
        return { ...prev, words: [] }
      })
    })
  }, [navigation, setOnboardingData])

  const onWordAmountClicked = () => {
    const newWordCount = wordCount === 12 ? 24 : 12
    setWordCount(newWordCount)

    let newIndex = 0

    // Set index if new word count is smaller
    if (newWordCount < wordCount) {
      const lastWordIndex = [...words]
        .splice(0, newWordCount)
        .reverse()
        .findIndex((w) => w !== null)

      if (lastWordIndex !== -1) {
        newIndex = newWordCount - 1 - lastWordIndex
      }
    } else if (words.every((w) => w !== null)) {
      // Set index to next word if all words are filled
      newIndex = wordCount
    }

    setWordIndex(newIndex)

    // Keep existing words if they fit within the bounds
    setWords((w) => {
      let fill = new Array(newWordCount).fill(null)
      fill = fill.map((word, index) => {
        if (index < newWordCount) {
          return w[index]
        }
        return word
      })
      return [...fill]
    })
  }

  const handleSelectWord = (selectedWord: string) => {
    setWords((w) => [
      ...w.slice(0, wordIndex),
      selectedWord,
      ...w.slice(wordIndex + 1),
    ])

    setWordIndex((i) => (i === wordCount - 1 ? i : i + 1))
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

  const navToTop = () => {
    if (hasAccounts) {
      parentNav.popToTop()
    } else {
      parentNav.navigate('CreateImport', undefined, { pop: true })
    }
  }

  const handleNext = async () => {
    try {
      const filteredWords: string[] = words.flatMap((w) => (w ? [w] : []))

      if (restoringAccount) {
        const restored =
          accounts && accountAddress
            ? await matchRestoredAccounts({
                accounts,
                accountAddress,
                derive: mnemonicDeriver(filteredWords),
              })
            : []

        if (!restored.length) {
          await showOKAlert({
            title: t('restoreAccount.errorAlert.title'),
            message: t('restoreAccount.errorAlert.message'),
          })
          return
        }
        await restoreSecureAccounts(
          restored.map(({ account, keypair, derivationPath }) => ({
            account,
            secureAccount: toSecureAccount({
              keypair,
              words: filteredWords,
              derivationPath,
            }),
          })),
        )
        reset()
        navigation.popToTop()
      } else {
        setOnboardingData((prev) => ({ ...prev, words: filteredWords }))
        navigation.navigate('ImportSubAccounts')
      }
    } catch {
      await showOKAlert({
        title: t('accountImport.alert.title'),
        message: t('accountImport.alert.body'),
      })
    }
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
    const newWords = copiedContent.split(' ')
    setWords(newWords)
    if (newWords.length > 12) {
      setWordCount(24)
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
          onPress={navToTop}
        >
          <CloseIcon size={16} colorClassName="accent-navy-foreground" />
        </PressableScale>
      </View>
      <KeyboardAwareScrollView
        extraKeyboardSpace={80}
        bottomOffset={155}
        keyboardShouldPersistTaps="always"
      >
        <Text
          size="4xl"
          numberOfLines={3}
          maxFontSizeMultiplier={1}
          adjustsFontSizeToFit
          className="mx-6 pb-4 pt-12 font-medium leading-[33px] text-navy-foreground"
        >
          {t('accountImport.wordEntry.title', { totalWords: wordCount })}
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
          onSubmit={() => void handleNext().catch(console.error)}
          onPaste={handleOnPaste}
        />
        <PressableScale
          testID="AccountImport.WordCount"
          feedback="opacity"
          onPress={onWordAmountClicked}
          className="flex-1 items-center"
        >
          <Text size="base" className="text-navy-foreground">
            {t('accountImport.wordEntry.changeWordAmount', {
              totalWords: wordCount === 12 ? 24 : 12,
            })}
          </Text>
        </PressableScale>
        <TabSafeAreaView edges={['bottom']} />
      </KeyboardAwareScrollView>
    </View>
  )
}

export default AccountImportScreen
