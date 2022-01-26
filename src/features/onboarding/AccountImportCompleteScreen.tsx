import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Text from '../../components/Text'
import SafeAreaBox from '../../components/SafeAreaBox'
import { OnboardingNavigationProp } from './onboardingTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from './OnboardingProvider'
import useAlert from '../../utils/useAlert'

const AccountImportCompleteScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const {
    onboardingData: { words, netType },
    setOnboardingData,
  } = useOnboarding()
  const { showOKAlert } = useAlert()

  const { createSecureAccount } = useAccountStorage()

  useEffect(() => {
    if (words?.length < 12) return

    const genKeypair = async () => {
      try {
        const account = await createSecureAccount(
          words,
          netType,
          words?.length === 24,
        )
        setOnboardingData((prev) => ({ ...prev, secureAccount: account }))
        navigation.navigate('AccountAssignScreen')
      } catch (error) {
        await showOKAlert({
          title: t('accountImport.alert.title'),
          message: t('accountImport.alert.body'),
        })
        navigation.goBack()
      }
    }

    genKeypair()
  }, [
    words,
    navigation,
    t,
    createSecureAccount,
    setOnboardingData,
    showOKAlert,
    netType,
  ])

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="primaryBackground"
      justifyContent="center"
    >
      <Text variant="body2" marginTop="xl" textAlign="center">
        {t('accountImport.complete.title')}
      </Text>
    </SafeAreaBox>
  )
}

export default AccountImportCompleteScreen
