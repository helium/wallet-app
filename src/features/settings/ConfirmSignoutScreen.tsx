import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { Alert, View } from 'react-native'
import useAlert from '@hooks/useAlert'
import { Spinner } from '@ui/Spinner'
import ConfirmWordsScreen from '../onboarding/create/ConfirmWordsScreen'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { SettingsNavigationProp } from './settingsTypes'
import { withICloudSignOutWarning } from './signOutWarning'
import { getSecureAccount } from '../../storage/secureStorage'
import { RootNavigationProp } from '../../navigation/rootTypes'

const ConfirmSignoutScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<
    HomeNavigationProp & SettingsNavigationProp
  >()
  const rootNav = useNavigation<RootNavigationProp>()
  const { showOKCancelAlert } = useAlert()
  const { currentAccount, signOut, accounts } = useAccountStorage()
  const { pin } = useAppStorage()

  const [mnemonic, setMnemonic] = useState<string[]>()

  useEffect(() => {
    const run = async () => {
      if (!currentAccount || !currentAccount.address) return
      const secureAccount = await getSecureAccount(currentAccount.address)
      setMnemonic(secureAccount?.mnemonic)
    }
    run().catch((e) => console.error(e))
  }, [currentAccount])

  const isPinRequired = useMemo(
    () => pin !== undefined && pin.status !== 'off',
    [pin],
  )

  const onWordsConfirmed = useCallback(() => {
    navigation.goBack()
    const currentAddress = currentAccount?.address
    const savedAccountAddresses = Object.keys(accounts || {})
    const isLastAccount =
      accounts &&
      currentAddress &&
      savedAccountAddresses.length === 1 &&
      savedAccountAddresses.includes(currentAddress)
    Alert.alert(
      t('settings.sections.account.signOutAlert.title', {
        alias: currentAccount?.alias,
      }),
      withICloudSignOutWarning(
        t,
        t(
          `settings.sections.account.signOutAlert.${
            isLastAccount ? 'bodyLastAccount' : 'body'
          }`,
          {
            alias: currentAccount?.alias,
          },
        ),
        isLastAccount ? 'allWallets' : 'oneWallet',
      ),
      [
        {
          text: t('generic.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.sections.account.signOut'),
          style: 'destructive',
          onPress: () =>
            void (async () => {
              if (isLastAccount) {
                // last account is signing out, clear all storage then nav to onboarding
                await signOut()
                rootNav.replace('OnboardingNavigator')
              } else {
                // sign out the specific account, then nav to home
                await signOut(currentAccount)
                navigation.popToTop()
              }
            })(),
        },
      ],
    )
  }, [accounts, currentAccount, navigation, rootNav, signOut, t])

  const onForgotWords = useCallback(async () => {
    navigation.goBack()
    const decision = await showOKCancelAlert({
      title: t('settings.confirmSignout.forgotAlert.title'),
      message: t('settings.confirmSignout.forgotAlert.body'),
    })
    if (!decision) return

    if (isPinRequired) {
      navigation.push('SettingsConfirmPin', {
        pin: pin?.value || '',
        action: 'revealWords',
      })
    } else {
      navigation.push('RevealWords')
    }
  }, [isPinRequired, navigation, pin, showOKCancelAlert, t])

  if (!mnemonic) return null

  return (
    <View className="flex-1">
      {mnemonic ? (
        <ConfirmWordsScreen
          title={t('settings.confirmSignout.title')}
          mnemonic={mnemonic}
          onComplete={onWordsConfirmed}
          onForgotWords={() => void onForgotWords().catch(console.error)}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Spinner colorClassName="accent-foreground" />
        </View>
      )}
    </View>
  )
}

export default ConfirmSignoutScreen
