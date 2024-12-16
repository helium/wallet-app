import Box from '@components/Box'
import Text from '@components/Text'
import useAlert from '@hooks/useAlert'
import { useNavigation } from '@react-navigation/native'
import { useSpacing } from '@config/theme/themeHooks'
import { upperCase } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { MAIN_DERIVATION_PATHS } from '@hooks/useDerivationAccounts'
import { Keypair } from '@solana/web3.js'
import { CSAccount } from '@config/storage/cloudStorage'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { createKeypair, toSecureAccount } from '@config/storage/secureStorage'
import SegmentedControl from '@components/SegmentedControl'
import SecretPhrase from '@assets/svgs/secretPhrase.svg'
import TouchableContainer from '@components/TouchableContainer'
import ScrollBox from '@components/ScrollBox'
import CheckButton from '@components/CheckButton'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useOnboarding } from '../OnboardingProvider'
import PassphraseAutocomplete from './PassphraseAutocomplete'
import { ImportAccountNavigationProp } from './importAccountNavTypes'
import { useOnboardingSheet } from '../OnboardingSheet'

const AccountImportScreen = () => {
  const { setOnboardingData, reset } = useOnboarding()
  const { upsertAccount, accounts } = useAccountStorage()
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const scrollViewRef = useRef<ScrollView>(null)
  const { carouselRef } = useOnboardingSheet()

  const restoringAccount = undefined
  const accountAddress = undefined
  const [wordCount, setWordCount] = useState(12)
  const { t } = useTranslation()
  const spacing = useSpacing()

  const [wordIndex, setWordIndex] = useState(0)
  const [words, setWords] = useState<(string | null)[]>(
    new Array(wordCount).fill(null),
  )
  const { showOKAlert } = useAlert()

  const options = useMemo(
    () => [
      {
        label: '12 Words',
        value: 12,
        Icon: undefined,
        iconProps: undefined,
      },
      {
        label: '24 Words',
        value: 24,
        Icon: undefined,
        iconProps: undefined,
      },
    ],
    [],
  )

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: wordIndex * 83,
      animated: true,
    })
  }, [wordIndex])

  useEffect(() => {
    return navigation.addListener('focus', () => {
      setOnboardingData((prev) => {
        return { ...prev, words: [] }
      })
    })
  }, [navigation, setOnboardingData])

  const onWordAmountClicked = useCallback(
    (newWordCountIndex: number) => {
      const newWordCount = options[newWordCountIndex].value
      setWordCount(newWordCount)

      let newIndex = 0

      // Set index if new word count is smaller
      if (newWordCount < wordCount && wordIndex > newWordCount - 1) {
        const lastWordIndex = [...words]
          .splice(0, newWordCount)
          .reverse()
          .findIndex((w) => w !== null)

        if (lastWordIndex !== -1) {
          newIndex = newWordCount - 1 - lastWordIndex
        }
      } else if (words.every((w) => w !== null && w !== undefined)) {
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
    },
    [options, wordCount, words, wordIndex],
  )

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
        carouselRef?.current?.snapToNext()
        setOnboardingData((prev) => ({ ...prev, words: filteredWords }))
      }
    } catch (error) {
      await showOKAlert({
        title: t('accountImport.alert.title'),
        message: t('accountImport.alert.body'),
      })
    }
  }, [
    carouselRef,
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

  const handleWordSelectedAtIndex = useCallback(
    (index: number) => () => {
      setWordIndex(index)
    },
    [],
  )

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item: w }: { item: string | null; index: number }) => {
      // index after selected
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
          backgroundColor={
            wordIndex === index ? 'primaryText' : 'primaryBackground'
          }
          borderRadius="full"
          marginStart={index === 0 ? '2xl' : undefined}
          marginEnd={index === wordCount - 1 ? '2xl' : undefined}
          opacity={opacity}
          marginBottom="xl"
          minWidth={83}
          pressableStyles={{ flex: undefined }}
        >
          <Text
            variant="textLgSemibold"
            color={wordIndex === index ? 'primaryBackground' : 'primaryText'}
          >
            {upperCase(
              w || t('accountImport.wordEntry.word', { ordinal: index + 1 }),
            )}
          </Text>
        </TouchableContainer>
      )
    },
    [handleWordSelectedAtIndex, t, wordCount, wordIndex],
  )

  const handleOnPaste = useCallback((copiedContent: string) => {
    const newWords = copiedContent.split(' ')
    setWords(newWords)
    if (newWords.length > 12) {
      setWordCount(24)
    }
  }, [])

  const showCheckButton = useMemo(() => {
    return words.every((w) => w !== null && w !== undefined)
  }, [words])

  return (
    <ScrollBox flex={1} contentContainerStyle={{ flex: 1 }}>
      <KeyboardAwareScrollView
        enableOnAndroid
        enableResetScrollToCoords
        keyboardShouldPersistTaps="always"
      >
        <SegmentedControl
          options={options}
          onItemSelected={onWordAmountClicked}
          paddingTop="4xl"
          paddingBottom={{ xs: '4xl', lg: '8xl' }}
        />
        <Box alignItems="center" gap="xl">
          <SecretPhrase width={60} height={60} />
          <Text
            color="primaryText"
            variant="displayMdSemibold"
            maxFontSizeMultiplier={1}
            marginHorizontal="6"
            adjustsFontSizeToFit
            textAlign="center"
          >
            {t('accountImport.wordEntry.title', { totalWords: wordCount })}
          </Text>

          <Text
            color="text.quaternary-500"
            variant="textXlRegular"
            maxFontSizeMultiplier={1}
            marginHorizontal="6"
            adjustsFontSizeToFit
            textAlign="center"
          >
            {t('accountImport.wordEntry.enterYourSecurityWords')}
          </Text>
        </Box>
        <Box marginTop="5xl" flexDirection="row">
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
            {words.map((w, i) => renderItem({ item: w, index: i }))}
          </ScrollBox>
        </Box>
        <PassphraseAutocomplete
          word={words[wordIndex]}
          complete={words.findIndex((w) => !w) === -1}
          onSelectWord={handleSelectWord}
          wordIdx={wordIndex}
          onSubmit={handleNext}
          onPaste={handleOnPaste}
        />
      </KeyboardAwareScrollView>
      {showCheckButton && <CheckButton onPress={handleNext} />}
    </ScrollBox>
  )
}

export default AccountImportScreen
