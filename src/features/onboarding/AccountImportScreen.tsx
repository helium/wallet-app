import React, { useCallback, useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import Text from '../../components/Text'
import { OnboardingNavigationProp } from './onboardingTypes'
import PassphraseAutocomplete from './PassphraseAutocomplete'
import Box from '../../components/Box'
import { useOnboarding } from './OnboardingProvider'
import ButtonPressable from '../../components/ButtonPressable'
import TextTransform from '../../components/TextTransform'

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
      {totalWords === undefined ? (
        <>
          <Box flex={1} justifyContent="center" alignItems="center">
            <Image source={require('@assets/images/fingerprint.png')} />
            <Text
              variant="h2"
              marginVertical="m"
              textAlign="center"
              lineHeight={34}
            >
              {t('accountImport.title')}
            </Text>
            <TextTransform
              variant="body1"
              textAlign="center"
              color="secondaryText"
              i18nKey="accountImport.subTitle"
            />
          </Box>
          <Text
            variant="body1"
            textAlign="center"
            marginBottom="l"
            color="secondaryText"
          >
            {t('accountImport.pickKeyType')}
          </Text>
          <Box flexDirection="row" marginBottom="xxl" marginHorizontal="l">
            <ButtonPressable
              width="50%"
              height={60}
              marginRight="xxs"
              borderTopLeftRadius="round"
              borderBottomLeftRadius="round"
              backgroundColor="havelockBlue"
              titleColor="black900"
              title={t('accountImport.restoreChoice', { totalWords: 12 })}
              onPress={set12Word}
            />
            <ButtonPressable
              width="50%"
              height={60}
              marginLeft="xxs"
              borderTopRightRadius="round"
              borderBottomRightRadius="round"
              backgroundColor="jazzberryJam"
              titleColor="black900"
              title={t('accountImport.restoreChoice', { totalWords: 24 })}
              onPress={set24Word}
            />
          </Box>
        </>
      ) : (
        <KeyboardAwareScrollView
          enableOnAndroid
          enableResetScrollToCoords={false}
          keyboardShouldPersistTaps="always"
        >
          <PassphraseAutocomplete
            onSelectWord={handleSelectWord}
            wordIdx={words.length}
            totalWords={totalWords}
          />
        </KeyboardAwareScrollView>
      )}
    </Box>
  )
}

export default AccountImportScreen
