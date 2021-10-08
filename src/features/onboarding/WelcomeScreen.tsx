import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'react-native'
import Box from '../../components/Box'
import {
  OnboardingNavigationProp,
  OnboardingStackParamList,
} from './onboardingTypes'

type Route = RouteProp<OnboardingStackParamList, 'Welcome'>
const WelcomeScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const { params } = useRoute<Route>()

  const createAccount = useCallback(
    () => navigation.navigate('AccountCreatePassphraseScreen', params),
    [navigation, params],
  )

  const importAccount = useCallback(() => {
    navigation.navigate('AccountImportScreen', params)
  }, [navigation, params])

  return (
    <Box flex={1} justifyContent="center" backgroundColor="primaryBackground">
      <Button
        onPress={createAccount}
        title={t('account_setup.welcome.create_account')}
      />
      <Button
        onPress={importAccount}
        title={t('account_setup.welcome.import_account')}
      />
    </Box>
  )
}

export default memo(WelcomeScreen)
