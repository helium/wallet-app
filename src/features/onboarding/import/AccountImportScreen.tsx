import React, { useCallback, useEffect } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Close from '@assets/images/close.svg'
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

type Route = RouteProp<ImportAccountStackParamList, 'AccountImportScreen'>
const AccountImportScreen = () => {
  const {
    setOnboardingData,
    onboardingData: { words },
  } = useOnboarding()
  const { hasAccounts } = useAccountStorage()
  const navigation = useNavigation<ImportAccountNavigationProp>()

  const parentNav = useNavigation<OnboardingNavigationProp>()
  const {
    params: { wordCount },
  } = useRoute<Route>()
  const { primaryText } = useColors()
  const scrollViewStyle = usePaddingStyle('xxxl', ['top'])

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

  const navToTop = useCallback(() => {
    if (hasAccounts) {
      parentNav.popToTop()
    } else {
      parentNav.navigate('CreateImport')
    }
  }, [hasAccounts, parentNav])

  useEffect(() => {
    if (words.length === wordCount) {
      navigation.navigate('ImportAccountConfirmScreen')
    }
  }, [navigation, words.length, wordCount])

  return (
    <Box flex={1}>
      <TouchableOpacityBox padding="l" onPress={navToTop} alignItems="flex-end">
        <Close color={primaryText} height={16} width={16} />
      </TouchableOpacityBox>
      <KeyboardAwareScrollView
        enableOnAndroid
        enableResetScrollToCoords={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={scrollViewStyle}
      >
        <PassphraseAutocomplete
          onSelectWord={handleSelectWord}
          wordIdx={words.length}
          totalWords={wordCount}
        />
      </KeyboardAwareScrollView>
    </Box>
  )
}

export default AccountImportScreen
