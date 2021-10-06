import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import {
  OnboardingNavigationProp,
  OnboardingStackParamList,
} from './onboardingTypes'
import ConfirmPinView from '../../components/ConfirmPinView'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

type Route = RouteProp<OnboardingStackParamList, 'AccountConfirmPinScreen'>

const AccountConfirmPinScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const { params } = route
  const { t } = useTranslation()
  const { updateViewType, upsertAccount, updatePin } = useAccountStorage()

  const pinSuccess = useCallback(
    (pin: string) => {
      if (params.pinReset) {
        // navigation.navigate('MoreScreen')
        return
      }

      if (params.viewType) {
        updateViewType(params.viewType)
      }
      if (params.account) {
        upsertAccount(params.account)
      }

      updatePin(pin)
    },
    [
      params.account,
      params.pinReset,
      params.viewType,
      updatePin,
      updateViewType,
      upsertAccount,
    ],
  )

  return (
    <ConfirmPinView
      originalPin={params.pin}
      title={t('account_setup.confirm_pin.title')}
      subtitle={t('account_setup.confirm_pin.subtitle')}
      pinSuccess={pinSuccess}
      onCancel={navigation.goBack}
    />
  )
}

export default AccountConfirmPinScreen
