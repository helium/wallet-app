import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { Account } from '@helium/react-native-sdk'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import PhraseChip from './PhraseChip'
import SafeAreaBox from '../../../components/SafeAreaBox'
import sleep from '../../../utils/sleep'
import useHaptic from '../../../utils/useHaptic'
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
const ConfirmWordsScreen = ({
  title,
  onComplete,
  onForgotWords,
  mnemonic,
}: Props) => {
  const [step, setStep] = useState(0)
  const [word, setWord] = useState<string | null>(null)
  const [correct, setCorrect] = useState(false)
  const [challengeWords, setChallengeWords] = useState<Array<string>>([])
  const { t } = useTranslation()
  const { triggerNotification } = useHaptic()
  const navigation = useNavigation<CreateAccountNavigationProp>()

  const findTargetWord = useCallback(
    (pos: number) => {
      return mnemonic[pos]
    },
    [mnemonic],
  )

  const nextStep = useCallback(() => {
    setTimeout(() => {
      const mnemonicLength = mnemonic.length || 12
      if (step === mnemonicLength - 1) {
        onComplete()
      } else {
        setStep(step + 1)
        setWord(null)
        animateTransition('AccountEnterPassphraseScreen.NextStep')
        setChallengeWords(
          Account.generateChallengeWords(findTargetWord(step + 1)),
        )
      }
    }, 1000)
  }, [findTargetWord, mnemonic.length, onComplete, step])

  const onPressWord = useCallback(
    async (w: string) => {
      setWord(w)

      if (w === findTargetWord(step)) {
        setCorrect(true)
        triggerNotification()
        nextStep()
      } else {
        setCorrect(false)
        triggerNotification('error')
        await sleep(1000)
        setWord(null)
        setChallengeWords(Account.generateChallengeWords(findTargetWord(step)))
      }
    },
    [findTargetWord, nextStep, step, triggerNotification],
  )

  const resetState = useCallback(async () => {
    setStep(0)
    setWord(null)
    setCorrect(false)
    setChallengeWords(Account.generateChallengeWords(findTargetWord(step)))
  }, [findTargetWord, step])

  useEffect(() => {
    resetState()
    return navigation.addListener('blur', () => {
      resetState()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation])

  const onSkip = useCallback(() => {
    if (__DEV__) {
      onComplete()
    }
  }, [onComplete])

  const onPressForgot = useCallback(() => {
    if (onForgotWords) {
      onForgotWords()
    } else {
      navigation.goBack()
    }
  }, [navigation, onForgotWords])

  const challengeWordChips = useMemo(
    () =>
      challengeWords.map((w) => (
        <PhraseChip
          marginRight="s"
          marginBottom="s"
          key={w}
          title={w}
          fail={word === w && !correct}
          success={word === w && correct}
          onPress={() => !word && onPressWord(w)}
        />
      )),
    [challengeWords, correct, onPressWord, word],
  )

  const onClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <SafeAreaBox flex={1} backgroundColor="secondary" paddingHorizontal="xl">
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
