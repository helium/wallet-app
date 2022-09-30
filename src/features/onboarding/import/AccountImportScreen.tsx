import React, { useCallback, useEffect, useRef, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Close from '@assets/images/close.svg'
import { FlatList } from 'react-native'
import { useTranslation } from 'react-i18next'
import { upperCase } from 'lodash'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { OnboardingNavigationProp } from '../onboardingTypes'
import PassphraseAutocomplete from './PassphraseAutocomplete'
import Box from '../../../components/Box'
import { useOnboarding } from '../OnboardingProvider'
import { useColors, usePaddingStyle } from '../../../theme/themeHooks'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'
import {
  ImportAccountNavigationProp,
  ImportAccountStackParamList,
} from './importAccountNavTypes'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import Text from '../../../components/Text'
import { createSecureAccount } from '../../../storage/secureStorage'
import useAlert from '../../../utils/useAlert'
import { Color } from '../../../theme/theme'

const accentColors = [
  'purple500',
  'blueBright500',
  'greenBright500',
  'orange500',
  'persianRose',
  'grey350',
  'flamenco',
  'electricViolet',
  'malachite',
  'turquoise',
  'white',
  'red500',
] as Color[]

type Route = RouteProp<ImportAccountStackParamList, 'AccountImportScreen'>
const AccountImportScreen = () => {
  const {
    setOnboardingData,
    onboardingData: { netType },
    reset,
  } = useOnboarding()
  const { upsertAccount, hasAccounts, accounts } = useAccountStorage()
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const parentNav = useNavigation<OnboardingNavigationProp>()
  const flatlistRef = useRef<FlatList>(null)
  const {
    params: { wordCount, restoringAccount, accountAddress },
  } = useRoute<Route>()
  const colors = useColors()
  const { t } = useTranslation()
  const flatListStyle = usePaddingStyle('m', ['left', 'right'])

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

  const handleSelectWord = useCallback(
    (selectedWord: string) => {
      setWords((w) => [
        ...w.slice(0, wordIndex),
        selectedWord,
        ...w.slice(wordIndex + 1),
      ])

      if (wordIndex === wordCount - 1) return
      setWordIndex(wordIndex + 1)
      flatlistRef?.current?.scrollToIndex({
        animated: true,
        index: wordIndex,
      })
    },
    [wordCount, wordIndex],
  )

  const navToTop = useCallback(() => {
    if (hasAccounts) {
      parentNav.popToTop()
    } else {
      parentNav.navigate('CreateImport')
    }
  }, [hasAccounts, parentNav])

  const handleNext = useCallback(async () => {
    try {
      const filteredWords: string[] = words.flatMap((w) => (w ? [w] : []))
      const account = await createSecureAccount({
        givenMnemonic: filteredWords,
        use24Words: words?.length === 24,
        netType,
      })
      if (restoringAccount) {
        if (!accounts || !accountAddress) {
          await showOKAlert({
            title: t('restoreAccount.errorAlert.title'),
            message: t('restoreAccount.errorAlert.message'),
          })
          return
        }
        const restoredAccount = Object.values(accounts).find(
          (a) => a.address === account.address,
        )
        if (!restoredAccount || accountAddress !== restoredAccount.address) {
          await showOKAlert({
            title: t('restoreAccount.errorAlert.title'),
            message: t('restoreAccount.errorAlert.message'),
          })
          return
        }
        await upsertAccount({
          alias: restoredAccount.alias,
          address: account.address,
          secureAccount: account,
        })
        reset()
        navigation.popToTop()
      } else {
        setOnboardingData((prev) => ({ ...prev, secureAccount: account }))
        navigation.navigate('AccountAssignScreen')
      }
    } catch (error) {
      await showOKAlert({
        title: t('accountImport.alert.title'),
        message: t('accountImport.alert.body'),
      })
    }
  }, [
    words,
    netType,
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
          paddingHorizontal="s"
          onPress={handleWordSelectedAtIndex(index)}
          paddingVertical="lm"
          // minWidth={wordWidth}
          alignItems="center"
        >
          <Text
            variant="body1"
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

  return (
    <Box flex={1} backgroundColor="secondary">
      <TouchableOpacityBox padding="l" onPress={navToTop} alignItems="flex-end">
        <Close color={colors.primaryText} height={16} width={16} />
      </TouchableOpacityBox>
      <KeyboardAwareScrollView
        extraScrollHeight={80}
        enableOnAndroid
        keyboardShouldPersistTaps="always"
      >
        <Text
          variant="h1"
          lineHeight={33}
          numberOfLines={3}
          maxFontSizeMultiplier={1}
          marginHorizontal="l"
          adjustsFontSizeToFit
          paddingTop="xxxl"
          paddingBottom="m"
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
        />
      </KeyboardAwareScrollView>
    </Box>
  )
}

export default AccountImportScreen
