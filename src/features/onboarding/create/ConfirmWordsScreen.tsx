import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { Account } from '@helium/react-native-sdk'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import PhraseChip from './PhraseChip'
import SafeAreaBox from '../../../components/SafeAreaBox'
import sleep from '../../../utils/sleep'
import useHaptic from '../../../hooks/useHaptic'
import animateTransition from '../../../utils/animateTransition'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'
import { CreateAccountNavigationProp } from './createAccountNavTypes'
import CloseButton from '../../../components/CloseButton'

type Props = {
  title?: string
  onComplete: () => void
  onForgotWords?: () => void
  mnemonic: string[]
}

const ConfirmWordsScreen: React.FC<Props> = ({
  title,
  onComplete,
  onForgotWords,
  mnemonic,
}) => {
  const [step, setStep] = useState(0)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [challengeWords, setChallengeWords] = useState<string[]>([])
  const { t } = useTranslation()
  const { triggerNotification } = useHaptic()
  const navigation = useNavigation<CreateAccountNavigationProp>()

  const findTargetWord = useCallback(
    (pos: number) => {
      return mnemonic[pos]
    },
    [mnemonic],
  )

  const isCorrectWord = useMemo(
    () => selectedWord === findTargetWord(step),
    [findTargetWord, selectedWord, step],
  )

  const nextStep = useCallback(() => {
    const mnemonicLength = mnemonic.length || 12

    if (step === mnemonicLength - 1) {
      onComplete()

      return
    }

    const currentStep = step + 1
    setStep(currentStep)
    setSelectedWord(null)
    animateTransition('AccountEnterPassphraseScreen.NextStep')
    setChallengeWords(
      Account.generateChallengeWords(findTargetWord(currentStep)),
    )
  }, [findTargetWord, mnemonic.length, onComplete, step])

  const onPressWord = useCallback(
    async (word: string) => {
      setSelectedWord(word)

      if (word === findTargetWord(step)) {
        triggerNotification()
        await sleep(1000)
        nextStep()

        return
      }

      triggerNotification('error')
      await sleep(1000)
      setSelectedWord(null)
      setChallengeWords(Account.generateChallengeWords(findTargetWord(step)))
    },
    [findTargetWord, nextStep, step, triggerNotification],
  )

  const resetState = useCallback(async () => {
    setStep(0)
    setSelectedWord(null)
    setChallengeWords(Account.generateChallengeWords(findTargetWord(0)))
  }, [findTargetWord])

  useEffect(() => {
    resetState()

    const unsubscribeFocus = navigation.addListener('blur', resetState)

    return unsubscribeFocus
  }, [navigation]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSkip = useCallback(() => {
    if (__DEV__) {
      onComplete()
    }
  }, [onComplete])

  const onClose = useCallback(() => {
    if (!navigation.canGoBack()) return

    navigation.goBack()
  }, [navigation])

  const onPressForgot = useCallback(() => {
    if (onForgotWords) {
      onForgotWords()
      return
    }

    onClose()
  }, [onClose, onForgotWords])

  const challengeWordChips = useMemo(
    () =>
      challengeWords.map((word) => (
        <PhraseChip
          marginRight="s"
          marginBottom="s"
          key={word}
          title={word}
          fail={selectedWord === word && !isCorrectWord}
          success={selectedWord === word && isCorrectWord}
          onPress={() => !selectedWord && onPressWord(word)}
        />
      )),
    [challengeWords, isCorrectWord, onPressWord, selectedWord],
  )

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="secondaryBackground"
      paddingHorizontal="xl"
    >
      <Box width="100%" alignItems="flex-end">
        <CloseButton onPress={onClose} />
      </Box>
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text
          variant="h4"
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1}
          marginBottom="m"
          textAlign="center"
          color="secondaryText"
        >
          {title || t('accountSetup.confirm.title')}
        </Text>
        <Text
          adjustsFontSizeToFit
          variant="h1"
          fontSize={44}
          lineHeight={44}
          marginVertical="m"
          textAlign="center"
        >
          {t('accountSetup.confirm.subtitleOrdinal', {
            ordinal: step + 1,
          })}
        </Text>
        <Box
          flexDirection="row"
          flexWrap="wrap"
          marginTop="m"
          justifyContent="center"
        >
          {challengeWordChips}
        </Box>
        <TouchableOpacityBox onPress={onPressForgot} paddingVertical="xxxl">
          <Text
            variant="h4"
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1}
            textAlign="center"
            color="secondaryText"
          >
            {t('accountSetup.confirm.forgot')}
          </Text>
        </TouchableOpacityBox>
        {__DEV__ && (
          <TouchableOpacityBox onPress={onSkip}>
            <Text
              variant="h4"
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1}
              textAlign="center"
              color="secondaryText"
            >
              {t('generic.skip')}
            </Text>
          </TouchableOpacityBox>
        )}
      </Box>
    </SafeAreaBox>
  )
}

export default memo(ConfirmWordsScreen)
