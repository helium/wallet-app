import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import ConfirmPinView from '@components/ConfirmPinView'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { SettingsNavigationProp, SettingsStackParamList } from './settingsTypes'

type Route = RouteProp<SettingsStackParamList, 'SettingsConfirmPin'>

const SettingsConfirmPinScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<SettingsNavigationProp>()
  const { params } = route
  const { t } = useTranslation()
  const { updatePin, updateRequirePinForPayment } = useAppStorage()

  const pinSuccess = useCallback(async () => {
    switch (params.action) {
      case 'remove':
        await updatePin('')
        navigation.goBack()
        break
      case 'create':
        await updatePin(params.pin)
        navigation.popToTop()
        break
      case 'reset':
        await updatePin('')
        navigation.replace('SettingsCreatePin')
        break
      case 'revealWords':
        navigation.replace('RevealWords')
        break
      case 'revealPrivateKey':
        navigation.replace('RevealPrivateKey')
        break
      case 'disablePaymentPin':
        await updateRequirePinForPayment(false)
        navigation.popToTop()
        break
    }
  }, [
    navigation,
    params.action,
    params.pin,
    updatePin,
    updateRequirePinForPayment,
  ])

  const title = useMemo(() => {
    switch (params.action) {
      default:
      case 'remove':
      case 'reset':
      case 'revealWords':
      case 'revealPrivateKey':
      case 'disablePaymentPin':
        return t('auth.title')
      case 'create':
        return t('accountSetup.confirmPin.title')
    }
  }, [params.action, t])

  const subtitle = useMemo(() => {
    switch (params.action) {
      default:
      case 'remove':
      case 'reset':
      case 'revealWords':
      case 'revealPrivateKey':
      case 'disablePaymentPin':
        return t('auth.enterCurrent')
      case 'create':
        return t('accountSetup.confirmPin.subtitle')
    }
  }, [params.action, t])

  return (
    <ConfirmPinView
      originalPin={params.pin}
      title={title}
      subtitle={subtitle}
      pinSuccess={pinSuccess}
      onCancel={navigation.goBack}
    />
  )
}

export default SettingsConfirmPinScreen
