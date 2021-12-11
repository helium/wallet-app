import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import {
  OnboardingNavigationProp,
  OnboardingStackParamList,
} from './onboardingTypes'
import ConfirmPinView from '../../components/ConfirmPinView'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from './OnboardingProvider'

type Route = RouteProp<OnboardingStackParamList, 'AccountConfirmPinScreen'>

const AccountConfirmPinScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const { params } = route
  const { t } = useTranslation()
  const { upsertAccount, updatePin } = useAccountStorage()
  const { reset } = useOnboarding()

  const pinSuccess = useCallback(
    (pin: string) => {
      if (params.pinReset) {
        // navigation.navigate('MoreScreen')
        return
      }

      if (params.account) {
        try {
          upsertAccount(params.account)
          reset()
        } catch (e) {
          console.error(e)
        }
      }

      updatePin(pin)
    },
    [params.account, params.pinReset, reset, updatePin, upsertAccount],
  )

  return (
    <ConfirmPinView
      originalPin={params.pin}
      title={t('accountSetup.confirmPin.title')}
      subtitle={t('accountSetup.confirmPin.subtitle')}
      pinSuccess={pinSuccess}
      onCancel={navigation.goBack}
    />
  )
}

export default AccountConfirmPinScreen
