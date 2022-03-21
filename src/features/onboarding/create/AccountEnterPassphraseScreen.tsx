import React, { useState, useEffect, useCallback, useRef } from 'react'
import { shuffle, uniq, take, reject, sampleSize } from 'lodash'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Carousel from 'react-native-snap-carousel'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import wordlist from '../../../constants/wordlists/english.json'
import PhraseChip from './PhraseChip'
import SafeAreaBox from '../../../components/SafeAreaBox'
import sleep from '../../../utils/sleep'
import useHaptic from '../../../utils/useHaptic'
import animateTransition from '../../../utils/animateTransition'
import { useOnboarding } from '../OnboardingProvider'
import {
  CreateAccountNavigationProp,
  CreateAccountStackParamList,
} from './createAccountNavTypes'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'

const generateChallengeWords = (targetWord: string) =>
  shuffle(
    uniq(
      take(reject(sampleSize(wordlist, 12), targetWord), 11).concat(targetWord),
    ),
  )

type CarouselItemData = number
type Route = RouteProp<
  CreateAccountStackParamList,
  'AccountEnterPassphraseScreen'
>
const AccountEnterPassphraseScreen = () => {
  const [step, setStep] = useState(0)
  const [word, setWord] = useState<string | null>(null)
  const [correct, setCorrect] = useState(false)
  const [challengeWords, setChallengeWords] = useState<Array<string>>([])
  const carouselRef = useRef<Carousel<CarouselItemData>>(null)
  const { t } = useTranslation()
  const { triggerNotification } = useHaptic()
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const { params } = useRoute<Route>()
  const {
    onboardingData: { secureAccount },
  } = useOnboarding()

  const findTargetWord = useCallback(
    (pos: number) => {
      if (!secureAccount) return ''

      return secureAccount.mnemonic[pos]
    },
    [secureAccount],
  )

  const nextStep = useCallback(() => {
    setTimeout(() => {
      const mnemonicLength = secureAccount?.mnemonic?.length || 12
      if (step === mnemonicLength - 1) {
        navigation.navigate('AccountAssignScreen', params)
      } else {
        carouselRef.current?.snapToItem(step + 1)
        setStep(step + 1)
        setWord(null)
        animateTransition('AccountEnterPassphraseScreen.NextStep')
        setChallengeWords(generateChallengeWords(findTargetWord(step + 1)))
      }
    }, 1000)
  }, [findTargetWord, navigation, params, secureAccount, step])

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
        setChallengeWords(generateChallengeWords(findTargetWord(step)))
        animateTransition('AccountEnterPassphraseScreen.OnPressWord')
      }
    },
    [findTargetWord, nextStep, step, triggerNotification],
  )

  const resetState = useCallback(async () => {
    setStep(0)
    setWord(null)
    setCorrect(false)
    setChallengeWords(generateChallengeWords(findTargetWord(step)))
  }, [findTargetWord, step])

  const skip = useCallback(
    () => navigation.navigate('AccountAssignScreen', params),
    [navigation, params],
  )

  useEffect(() => {
    resetState()
    const unsubscribe = navigation.addListener('blur', () => {
      resetState()
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation])

  return (
    <SafeAreaBox
      backgroundColor="primaryBackground"
      flex={1}
      paddingHorizontal="xl"
      justifyContent="center"
    >
      <Text
        variant="h1"
        numberOfLines={2}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1}
        lineHeight={39}
        marginBottom="m"
      >
        {t('accountSetup.confirm.title')}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        variant="body0"
        lineHeight={21}
        color="secondaryText"
      >
        {t('accountSetup.confirm.subtitle')}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        variant="body0"
        lineHeight={21}
        marginBottom="m"
      >
        {t('accountSetup.confirm.subtitleOrdinal', {
          ordinal: t(`ordinals.${step}`),
        })}
      </Text>
      <Box flexDirection="row" flexWrap="wrap" marginTop="m">
        {challengeWords.map((w) => (
          <PhraseChip
            marginRight="s"
            marginBottom="s"
            key={w}
            title={w}
            fail={word === w && !correct}
            success={word === w && correct}
            onPress={() => !word && onPressWord(w)}
          />
        ))}
      </Box>
      <TouchableOpacityBox
        onPress={__DEV__ ? skip : navigation.goBack}
        paddingVertical="xl"
      >
        <Text color="primaryText" variant="body0">
          {__DEV__ ? t('generic.skip') : t('accountSetup.confirm.forgot')}
        </Text>
      </TouchableOpacityBox>
    </SafeAreaBox>
  )
}

export default AccountEnterPassphraseScreen
