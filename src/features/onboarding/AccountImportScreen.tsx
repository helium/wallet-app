import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { OnboardingNavigationProp } from './onboardingTypes'
import PassphraseAutocomplete, { TOTAL_WORDS } from './PassphraseAutocomplete'
import Box from '../../components/Box'
import { useOnboarding } from './OnboardingProvider'

const AccountImportScreen = () => {
  const {
    setOnboardingData,
    onboardingData: { words },
  } = useOnboarding()

  const navigation = useNavigation<OnboardingNavigationProp>()

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setOnboardingData((prev) => {
        return { ...prev, words: [] }
      })
    })

    return unsubscribe
  }, [navigation, setOnboardingData])

  const handleSelectWord = (selectedWord: string) => {
    setOnboardingData((prev) => {
      const nextWords = [...prev.words, selectedWord]
      return { ...prev, words: nextWords }
    })
  }

  useEffect(() => {
    if (words.length === TOTAL_WORDS) {
      navigation.navigate('ImportAccountConfirmScreen')
    }
  }, [navigation, words.length])

  return (
    <Box flex={1} flexDirection="column">
      <KeyboardAwareScrollView
        enableOnAndroid
        enableResetScrollToCoords={false}
        keyboardShouldPersistTaps="always"
      >
        <PassphraseAutocomplete
          onSelectWord={handleSelectWord}
          wordIdx={words.length}
        />
      </KeyboardAwareScrollView>
    </Box>
  )
}

export default AccountImportScreen
