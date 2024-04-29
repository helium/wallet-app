import ConfirmPinView from '@components/ConfirmPinView'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Keypair } from '@solana/web3.js'
import { toSecureAccount } from '@storage/secureStorage'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { useOnboarding } from './OnboardingProvider'
import { CreateAccountStackParamList } from './create/createAccountNavTypes'
import { ImportAccountStackParamList } from './import/importAccountNavTypes'
import { OnboardingNavigationProp } from './onboardingTypes'

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
      if (params.secretKey) {
        try {
          const keypair = Keypair.fromSecretKey(
            Uint8Array.from(Buffer.from(params.secretKey, 'base64')),
          )
          await upsertAccount({
            address: heliumAddressFromSolAddress(keypair.publicKey.toBase58()),
            alias: params.alias!,
            secureAccount: toSecureAccount({
              words: params.words,
              keypair,
              derivationPath: params.derivationPath,
            }),
            derivationPath: params.derivationPath,
          })
        } catch (e) {
          console.error(e)
        }
      }

      reset()

      rootNav.reset({
        index: 0,
        routes: [
          {
            name: 'TabBarNavigator',
          },
        ],
      })

      await updatePin(pin)
    },
    [
      params.alias,
      params.derivationPath,
      params.secretKey,
      params.words,
      reset,
      rootNav,
      updatePin,
      upsertAccount,
    ],
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
