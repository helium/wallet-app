import React, { useEffect } from 'react'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Text from '../../components/Text'
import SafeAreaBox from '../../components/SafeAreaBox'
import {
  OnboardingNavigationProp,
  OnboardingStackParamList,
} from './onboardingTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

type Route = RouteProp<OnboardingStackParamList, 'AccountImportCompleteScreen'>

const AccountImportCompleteScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()

  const { createSecureAccount } = useAccountStorage()
  const {
    params: { words, multiAccount },
  } = useRoute<Route>()

  useEffect(() => {
    let timer: NodeJS.Timeout

    const genKeypair = async () => {
      try {
        const account = await createSecureAccount(words)
        timer = setTimeout(() => {
          navigation.navigate('AccountAssignScreen', {
            ...account,
            multiAccount,
          })
        }, 2000)
      } catch (error) {
        timer = setTimeout(() => {
          Alert.alert(
            t('account_import.alert.title'),
            t('account_import.alert.body'),
            [{ text: t('generic.ok'), onPress: () => navigation.goBack() }],
            { cancelable: false },
          )
        }, 1000)
      }
    }

    genKeypair()

    return () => {
      clearTimeout(timer)
    }
  }, [words, navigation, t, createSecureAccount, multiAccount])

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="primaryBackground"
      justifyContent="center"
    >
      <Text variant="body2" color="white" marginTop="lx" textAlign="center">
        {t('account_import.complete.title')}
      </Text>
    </SafeAreaBox>
  )
}

export default AccountImportCompleteScreen
