import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'react-native'
import Box from '../../components/Box'
import { OnboardingNavigationProp } from './onboardingTypes'

const WelcomeScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()

  const createAccount = useCallback(
    () => navigation.push('AccountCreatePassphraseScreen'),
    [navigation],
  )

  const importAccount = useCallback(() => {
    navigation.push('AccountImportScreen')
  }, [navigation])

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
