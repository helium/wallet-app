import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import ConfirmPinView from '@components/ConfirmPinView'
import { OnboardingNavigationProp } from './onboardingTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from './OnboardingProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { CreateAccountStackParamList } from './create/createAccountNavTypes'
import { ImportAccountStackParamList } from './import/importAccountNavTypes'
import { RootNavigationProp } from '../../navigation/rootTypes'

type Route = RouteProp<
  CreateAccountStackParamList & ImportAccountStackParamList,
  'AccountConfirmPinScreen'
>

const AccountConfirmPinScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { params } = route
  const { t } = useTranslation()
  const { upsertAccount } = useAccountStorage()
  const { updatePin } = useAppStorage()
  const { reset } = useOnboarding()

  const pinSuccess = useCallback(
    async (pin: string) => {
      if (params.account) {
        try {
          await upsertAccount({
            address: params.account.address,
            alias: params.account.alias,
            secureAccount: {
              mnemonic: params.account.mnemonic,
              keypair: params.account.keypair,
              address: params.account.address,
            },
          })
          reset()
          rootNav.reset({
            index: 0,
            routes: [
              {
                name: 'TabBarNavigator',
              },
            ],
          })
        } catch (e) {
          console.error(e)
        }
      }

      await updatePin(pin)
    },
    [params.account, reset, rootNav, updatePin, upsertAccount],
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
