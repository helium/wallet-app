import Close from '@assets/images/close.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import useAlert from '@hooks/useAlert'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Color } from '@theme/theme'
import { useColors, usePaddingStyle } from '@theme/themeHooks'
import { upperCase } from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { MAIN_DERIVATION_PATHS } from '@hooks/useDerivationAccounts'
import { Keypair } from '@solana/web3.js'
import { CSAccount } from '@storage/cloudStorage'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { createKeypair, toSecureAccount } from '../../../storage/secureStorage'
import { useOnboarding } from '../OnboardingProvider'
import { OnboardingNavigationProp } from '../onboardingTypes'
import PassphraseAutocomplete from './PassphraseAutocomplete'
import {
  ImportAccountNavigationProp,
  ImportAccountStackParamList,
} from './importAccountNavTypes'

const accentColors = [
  'purple.500',
  'blue.light-500',
  'green.light-500',
  'orange.500',
  'pink.500',
  'gray.350',
  'orange.500',
  'violet.200',
  'green.500',
  'cyan.500',
  'base.white',
  'ros.500',
] as Color[]

type Route = RouteProp<ImportAccountStackParamList, 'AccountImportScreen'>
const AccountImportScreen = () => {
  const { setOnboardingData, reset } = useOnboarding()
  const { upsertAccount, hasAccounts, accounts } = useAccountStorage()
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const parentNav = useNavigation<OnboardingNavigationProp>()
  const flatlistRef = useRef<FlatList>(null)
  const {
    params: { restoringAccount, accountAddress },
  } = useRoute<Route>()
  const [wordCount, setWordCount] = useState(12)
  const colors = useColors()
  const { t } = useTranslation()
  const flatListStyle = usePaddingStyle('4', ['left', 'right'])

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

  const getAccent = useCallback(
    (idx) => {
      return {
        key: accentColors[idx % 12],
        value: colors[accentColors[idx % 12]],
      }
    },
    [colors],
  )

  const onWordAmountClicked = useCallback(() => {
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
  }, [wordCount, words])

  const handleSelectWord = useCallback(
    (selectedWord: string) => {
      setWords((w) => [
        ...w.slice(0, wordIndex),
        selectedWord,
        ...w.slice(wordIndex + 1),
      ])

      if (wordIndex === wordCount - 1) return
      setWordIndex(wordIndex + 1)
    },
    [wordCount, wordIndex],
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

  const navToTop = useCallback(() => {
    if (hasAccounts) {
      parentNav.popToTop()
    } else {
      parentNav.navigate('CreateImport')
    }
  }, [hasAccounts, parentNav])

  const handleNext = useCallback(async () => {
    try {
      let keypair: Keypair | undefined
      const filteredWords: string[] = words.flatMap((w) => (w ? [w] : []))
      const foundDerivation = Object.values(accounts || {}).find(
        (a) => a.address === accountAddress,
      )?.derivationPath

      if (foundDerivation) {
        keypair = (
          await createKeypair({
            givenMnemonic: filteredWords,
            use24Words: words?.length === 24,
            derivationPath: foundDerivation,
          })
        ).keypair
      }

      if (restoringAccount) {
        let restoredAccount: CSAccount | undefined
        if (!accounts || !accountAddress) {
          await showOKAlert({
            title: t('restoreAccount.errorAlert.title'),
            message: t('restoreAccount.errorAlert.message'),
          })
          return
        }

        if (keypair) {
          restoredAccount = Object.values(accounts).find(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (a) => a.solanaAddress === keypair!.publicKey.toBase58(),
          )
        } else {
          const keypairs = await Promise.all(
            MAIN_DERIVATION_PATHS.map((dpath) =>
              createKeypair({
                givenMnemonic: filteredWords,
                use24Words: words?.length === 24,
                derivationPath: dpath,
              }),
            ),
          )

          restoredAccount = Object.values(accounts).find((a) =>
            keypairs.some(
              (k) => a.solanaAddress === k.keypair.publicKey.toBase58(),
            ),
          )

          if (restoredAccount) {
            keypair = keypairs.find(
              (k) =>
                restoredAccount?.solanaAddress ===
                k.keypair.publicKey.toBase58(),
            )?.keypair
          }
        }

        if (
          !keypair ||
          !restoredAccount ||
          accountAddress !== restoredAccount.address
        ) {
          await showOKAlert({
            title: t('restoreAccount.errorAlert.title'),
            message: t('restoreAccount.errorAlert.message'),
          })
          return
        }
        await upsertAccount({
          alias: restoredAccount.alias,
          address: restoredAccount.address,
          secureAccount: toSecureAccount({ keypair, words: filteredWords }),
        })
        reset()
        navigation.popToTop()
      } else {
        setOnboardingData((prev) => ({ ...prev, words: filteredWords }))
        navigation.navigate('ImportSubAccounts')
      }
    } catch (error) {
      await showOKAlert({
        title: t('accountImport.alert.title'),
        message: t('accountImport.alert.body'),
      })
    }
  }, [
    words,
    restoringAccount,
    accounts,
    accountAddress,
    upsertAccount,
    reset,
    navigation,
    showOKAlert,
    t,
    setOnboardingData,
  ])

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
          paddingHorizontal="2"
          onPress={handleWordSelectedAtIndex(index)}
          paddingVertical="5"
          alignItems="center"
        >
          <Text
            variant="textMdRegular"
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
    const newWords = copiedContent.split(' ')
    setWords(newWords)
    if (newWords.length > 12) {
      setWordCount(24)
    }
  }, [])

  return (
    <Box flex={1} backgroundColor="secondaryBackground">
      <TouchableOpacityBox padding="6" onPress={navToTop} alignItems="flex-end">
        <Close color={colors.primaryText} height={16} width={16} />
      </TouchableOpacityBox>
      <KeyboardAwareScrollView
        extraScrollHeight={80}
        enableOnAndroid
        keyboardShouldPersistTaps="always"
      >
        <Text
          color="primaryText"
          variant="displayMdRegular"
          lineHeight={33}
          numberOfLines={3}
          maxFontSizeMultiplier={1}
          marginHorizontal="6"
          adjustsFontSizeToFit
          paddingTop="15"
          paddingBottom="4"
        >
          {t('accountImport.wordEntry.title', { totalWords: wordCount })}
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
          onSubmit={handleNext}
          accentKey={getAccent(wordIndex).key}
          accentValue={getAccent(wordIndex).value}
          onPaste={handleOnPaste}
        />
        <TouchableOpacityBox
          onPress={onWordAmountClicked}
          flex={1}
          alignItems="center"
        >
          <Text variant="textMdRegular" color="secondaryText">
            {t('accountImport.wordEntry.changeWordAmount', {
              totalWords: wordCount === 12 ? 24 : 12,
            })}
          </Text>
        </TouchableOpacityBox>
      </KeyboardAwareScrollView>
    </Box>
  )
}

export default AccountImportScreen
