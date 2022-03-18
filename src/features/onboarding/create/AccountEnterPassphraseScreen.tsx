import React, { useState, useEffect, useCallback, useRef } from 'react'
import { shuffle, uniq, take, reject, sampleSize, upperCase } from 'lodash'
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
import TextTransform from '../../../components/TextTransform'
import { useOnboarding } from '../OnboardingProvider'
import ButtonPressable from '../../../components/ButtonPressable'
import {
  CreateAccountNavigationProp,
  CreateAccountStackParamList,
} from './createAccountNavTypes'

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

  const renderItem = useCallback(
    (index: number) => {
      return (
        <Box
          overflow="hidden"
          borderRadius="xl"
          marginVertical="m"
          backgroundColor="surfaceSecondary"
          paddingHorizontal="l"
          justifyContent="center"
          height={{ smallPhone: 70, phone: 90 }}
          alignItems="center"
          flexDirection="row"
        >
          <Text variant="h1" color="primaryText" maxFontSizeMultiplier={1}>
            {`${index + 1}. `}
          </Text>
          <Text variant="h1" color="primaryText" maxFontSizeMultiplier={1}>
            {step === index && word ? upperCase(word) : '?????'}
          </Text>
        </Box>
      )
    },
    [step, word],
  )

  return (
    <SafeAreaBox
      backgroundColor="primaryBackground"
      flex={1}
      paddingHorizontal="xl"
    >
      <Box flex={2} />
      <Text
        variant="h1"
        numberOfLines={2}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1}
        lineHeight={37}
      >
        {t('accountSetup.confirm.title')}
      </Text>
      <Box flex={0.5} />
      <TextTransform
        numberOfLines={1}
        adjustsFontSizeToFit
        values={{
          ordinal: t(`ordinals.${step}`),
        }}
        variant="subtitle2"
        i18nKey="accountSetup.confirm.subtitle"
      />

      {renderItem(step)}
      <Box flex={1} />
      <Box flexDirection="row" flexWrap="wrap">
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
      <Box flex={2} />
      <ButtonPressable
        height={50}
        borderRadius="round"
        borderBottomRightRadius="round"
        backgroundColor="primaryBackground"
        titleColor="primaryText"
        title={__DEV__ ? t('generic.skip') : t('accountSetup.confirm.forgot')}
        onPress={__DEV__ ? skip : navigation.goBack}
      />
    </SafeAreaBox>
  )
}

export default AccountEnterPassphraseScreen
