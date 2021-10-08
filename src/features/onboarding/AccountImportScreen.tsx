import React, { useState, useEffect } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {
  OnboardingNavigationProp,
  OnboardingStackParamList,
} from './onboardingTypes'
import PassphraseAutocomplete, { TOTAL_WORDS } from './PassphraseAutocomplete'
import SafeAreaBox from '../../components/SafeAreaBox'

type Route = RouteProp<OnboardingStackParamList, 'AccountImportScreen'>
const AccountImportScreen = () => {
  const { params } = useRoute<Route>()
  const [words, setWords] = useState(new Array<string>())

  const navigation = useNavigation<OnboardingNavigationProp>()

  const resetState = () => {
    setWords([])
  }

  useEffect(() => {
    resetState()
    const unsubscribe = navigation.addListener('blur', () => {
      resetState()
    })

    return unsubscribe
  }, [navigation])

  const handleSelectWord = (selectedWord: string) => {
    setWords((prevWords) => {
      const nextWords = [...prevWords, selectedWord]
      if (nextWords.length === TOTAL_WORDS) {
        navigation.navigate('ImportAccountConfirmScreen', {
          words: nextWords,
          ...params,
        })
      }
      return nextWords
    })
  }

  return (
    <SafeAreaBox
      flex={1}
      padding="l"
      backgroundColor="primaryBackground"
      flexDirection="column"
    >
      <KeyboardAwareScrollView
        enableOnAndroid
        enableResetScrollToCoords={false}
        extraScrollHeight={40}
        keyboardShouldPersistTaps="always"
      >
        <PassphraseAutocomplete
          onSelectWord={handleSelectWord}
          wordIdx={words.length}
        />
      </KeyboardAwareScrollView>
    </SafeAreaBox>
  )
}

export default AccountImportScreen
