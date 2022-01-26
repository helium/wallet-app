import React, { useCallback, useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useTranslation } from 'react-i18next'
import { OnboardingNavigationProp } from './onboardingTypes'
import PassphraseAutocomplete from './PassphraseAutocomplete'
import Box from '../../components/Box'
import { useOnboarding } from './OnboardingProvider'
import ButtonPressable from '../../components/ButtonPressable'

const AccountImportScreen = () => {
  const {
    setOnboardingData,
    onboardingData: { words },
  } = useOnboarding()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const { t } = useTranslation()
  const [totalWords, setTotalWords] = useState<12 | 24>()

  useEffect(() => {
    return navigation.addListener('focus', () => {
      setOnboardingData((prev) => {
        return { ...prev, words: [] }
      })
    })
  }, [navigation, setOnboardingData])

  const handleSelectWord = useCallback(
    (selectedWord: string) => {
      setOnboardingData((prev) => {
        const nextWords = [...prev.words, selectedWord]
        return { ...prev, words: nextWords }
      })
    },
    [setOnboardingData],
  )

  useEffect(() => {
    if (words.length === totalWords) {
      navigation.navigate('ImportAccountConfirmScreen')
    }
  }, [navigation, words.length, totalWords])

  const set12Word = useCallback(() => setTotalWords(12), [])

  const set24Word = useCallback(() => setTotalWords(24), [])

  return (
    <Box flex={1} flexDirection="column">
      <KeyboardAwareScrollView
        enableOnAndroid
        enableResetScrollToCoords={false}
        keyboardShouldPersistTaps="always"
      >
        {totalWords === undefined ? (
          <Box justifyContent="center" alignItems="center" marginTop="xl">
            <ButtonPressable
              borderRadius="m"
              backgroundColor="surfaceSecondary"
              titleColor="primaryText"
              title={t('accountImport.restoreChoice', { totalWords: 12 })}
              marginBottom="m"
              onPress={set12Word}
            />
            <ButtonPressable
              borderRadius="m"
              backgroundColor="surfaceSecondary"
              titleColor="primaryText"
              title={t('accountImport.restoreChoice', { totalWords: 24 })}
              onPress={set24Word}
            />
          </Box>
        ) : (
          <PassphraseAutocomplete
            onSelectWord={handleSelectWord}
            wordIdx={words.length}
            totalWords={totalWords}
          />
        )}
      </KeyboardAwareScrollView>
    </Box>
  )
}

export default AccountImportScreen
