import React, { useCallback } from 'react'
import ConfirmWordsScreen from './ConfirmWordsScreen'
import { useOnboarding } from '../OnboardingProvider'
import { useOnboardingSheet } from '../OnboardingSheet'

const AccountEnterPassphraseScreen = () => {
  const {
    onboardingData: { words },
  } = useOnboarding()
  const { carouselRef } = useOnboardingSheet()

  const onWordsConfirmed = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  return (
    <ConfirmWordsScreen mnemonic={words || []} onComplete={onWordsConfirmed} />
  )
}

export default AccountEnterPassphraseScreen
