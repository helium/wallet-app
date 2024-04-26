import React, { useCallback } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import {
  CreateAccountNavigationProp,
  CreateAccountStackParamList,
} from './createAccountNavTypes'
import ConfirmWordsScreen from './ConfirmWordsScreen'
import { useOnboarding } from '../OnboardingProvider'

type Route = RouteProp<
  CreateAccountStackParamList,
  'AccountEnterPassphraseScreen'
>
const AccountEnterPassphraseScreen = () => {
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const { params } = useRoute<Route>()
  const {
    onboardingData: { words },
  } = useOnboarding()

  const onWordsConfirmed = useCallback(
    () => navigation.navigate('AccountAssignScreen', params),
    [navigation, params],
  )

  return (
    <ConfirmWordsScreen mnemonic={words || []} onComplete={onWordsConfirmed} />
  )
}

export default AccountEnterPassphraseScreen
